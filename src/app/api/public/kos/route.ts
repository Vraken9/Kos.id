import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { HAVERSINE_SQL } from '@/lib/distance';
import type { AppSettings } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q') || '';
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null;
    const maxDistanceKm = searchParams.get('maxDistanceKm') ? Number(searchParams.get('maxDistanceKm')) : null;
    const genderType = searchParams.get('genderType') || '';
    const facilities = searchParams.get('facilities') || '';
    const availableOnly = searchParams.get('availableOnly') === 'true';
    const sort = searchParams.get('sort') || 'recommended';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '12')));
    const offset = (page - 1) * limit;

    // Get campus settings for distance calculation
    const settings = await queryOne<AppSettings>(
      'SELECT campus_latitude, campus_longitude FROM app_settings WHERE id = 1'
    );

    const campusLat = settings?.campus_latitude ? Number(settings.campus_latitude) : null;
    const campusLon = settings?.campus_longitude ? Number(settings.campus_longitude) : null;
    const hasCoordinates = campusLat !== null && campusLon !== null;

    // Build query
    const conditions: string[] = ['k.is_active = 1'];
    const params: any[] = [];

    // Distance select
    let distanceSelect = 'NULL AS distance_km';
    const distanceParams: any[] = [];
    if (hasCoordinates) {
      distanceSelect = `${HAVERSINE_SQL} AS distance_km`;
      distanceParams.push(campusLat, campusLon, campusLat);
    }

    // Keyword filter
    if (q) {
      conditions.push('(k.name LIKE ? OR k.address LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }

    // Gender filter
    if (genderType && ['putra', 'putri', 'campur'].includes(genderType)) {
      conditions.push('k.gender_type = ?');
      params.push(genderType);
    }

    // Facilities filter
    if (facilities) {
      const facilitySlugs = facilities.split(',').map(s => s.trim()).filter(Boolean);
      if (facilitySlugs.length > 0) {
        const placeholders = facilitySlugs.map(() => '?').join(',');
        conditions.push(`k.id IN (
          SELECT kf.kos_id FROM kos_facilities kf
          JOIN facilities f ON f.id = kf.facility_id
          WHERE f.slug IN (${placeholders}) AND f.is_active = 1
          GROUP BY kf.kos_id
          HAVING COUNT(DISTINCT f.slug) = ?
        )`);
        params.push(...facilitySlugs, facilitySlugs.length);
      }
    }

    // Build the main query with subqueries for price and stock
    let sql = `
      SELECT 
        k.id, k.name, k.slug, k.address, k.gender_type, k.is_featured,
        k.latitude, k.longitude,
        ${distanceSelect},
        (SELECT MIN(rt.price_monthly) FROM room_types rt WHERE rt.kos_id = k.id AND rt.is_active = 1) AS minimum_price,
        (SELECT COALESCE(SUM(rt.stock_available), 0) FROM room_types rt WHERE rt.kos_id = k.id AND rt.is_active = 1) AS available_stock,
        (SELECT kp.image_path FROM kos_photos kp WHERE kp.kos_id = k.id AND kp.is_cover = 1 LIMIT 1) AS cover_image_url
      FROM kos k
    `;

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // We need to wrap for HAVING clauses (price, distance, available)
    let havingConditions: string[] = [];
    const havingParams: any[] = [];

    if (minPrice !== null) {
      havingConditions.push('minimum_price >= ?');
      havingParams.push(minPrice);
    }
    if (maxPrice !== null) {
      havingConditions.push('minimum_price <= ?');
      havingParams.push(maxPrice);
    }
    if (availableOnly) {
      havingConditions.push('available_stock > 0');
    }
    if (maxDistanceKm !== null && hasCoordinates) {
      havingConditions.push('distance_km <= ?');
      havingParams.push(maxDistanceKm);
    }

    const havingClause = havingConditions.length > 0 ? `HAVING ${havingConditions.join(' AND ')}` : '';

    // Sorting
    const sortMap: Record<string, string> = {
      recommended: 'available_stock > 0 DESC, k.is_featured DESC, distance_km ASC, minimum_price ASC, k.created_at DESC',
      nearest: hasCoordinates ? 'distance_km ASC' : 'k.created_at DESC',
      cheapest: 'minimum_price ASC',
      highest_price: 'minimum_price DESC',
      most_available: 'available_stock DESC',
    };
    const orderBy = sortMap[sort] || sortMap.recommended;

    const fullSql = `${sql} ${whereClause} ${havingClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    const allParams = [...distanceParams, ...params, ...havingParams, limit, offset];

    const rows = await query<Record<string, unknown>[]>(fullSql, allParams);

    // Get count for pagination
    const countSql = `SELECT COUNT(*) as total FROM (${sql} ${whereClause} ${havingClause}) AS counted`;
    const countParams = [...distanceParams, ...params, ...havingParams];
    const countResult = await queryOne<{ total: number }>(countSql, countParams);
    const total = countResult?.total || 0;

    // Get facilities for each kos
    const kosIds = rows.map((r) => r.id as number);
    let facilitiesMap: Record<number, { name: string; slug: string; iconKey: string | null }[]> = {};

    if (kosIds.length > 0) {
      const placeholders = kosIds.map(() => '?').join(',');
      const facilityRows = await query<Record<string, unknown>[]>(
        `SELECT kf.kos_id, f.name, f.slug, f.icon_key
         FROM kos_facilities kf
         JOIN facilities f ON f.id = kf.facility_id
         WHERE kf.kos_id IN (${placeholders}) AND f.is_active = 1`,
        kosIds
      );

      for (const row of facilityRows) {
        const kosId = row.kos_id as number;
        if (!facilitiesMap[kosId]) facilitiesMap[kosId] = [];
        facilitiesMap[kosId].push({
          name: row.name as string,
          slug: row.slug as string,
          iconKey: row.icon_key as string | null,
        });
      }
    }

    // Format response
    const data = rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      address: row.address,
      coverImageUrl: row.cover_image_url || null,
      genderType: row.gender_type,
      distanceKm: row.distance_km !== null ? Number(Number(row.distance_km).toFixed(1)) : null,
      minimumPrice: row.minimum_price ? Number(row.minimum_price) : null,
      availableStock: Number(row.available_stock || 0),
      isAvailable: Number(row.available_stock || 0) > 0,
      facilities: (facilitiesMap[row.id as number] || []).slice(0, 4),
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching kos list:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server.' } },
      { status: 500 }
    );
  }
}
