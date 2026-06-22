import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, getConnection } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { kosCreateSchema } from '@/lib/validation';
import { normalizeIndonesianWhatsapp } from '@/lib/phone';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (q) {
      conditions.push('(k.name LIKE ? OR k.address LIKE ? OR k.owner_name LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (status === 'active') {
      conditions.push('k.is_active = 1');
    } else if (status === 'inactive') {
      conditions.push('k.is_active = 0');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await query<Record<string, unknown>[]>(
      `SELECT k.*,
        (SELECT MIN(rt.price_monthly) FROM room_types rt WHERE rt.kos_id = k.id AND rt.is_active = 1) AS minimum_price,
        (SELECT COALESCE(SUM(rt.stock_available), 0) FROM room_types rt WHERE rt.kos_id = k.id AND rt.is_active = 1) AS available_stock,
        (SELECT kp.image_path FROM kos_photos kp WHERE kp.kos_id = k.id AND kp.is_cover = 1 LIMIT 1) AS cover_image_url
      FROM kos k ${whereClause}
      ORDER BY k.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const countResult = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM kos k ${whereClause}`,
      params
    );

    return NextResponse.json({
      success: true,
      data: {
        items: rows,
        pagination: {
          page, limit,
          total: countResult?.total || 0,
          totalPages: Math.ceil((countResult?.total || 0) / limit),
        },
      },
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = kosCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Data tidak valid', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check slug uniqueness
    const existing = await queryOne<{ id: number }>('SELECT id FROM kos WHERE slug = ?', [data.slug]);
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Slug sudah digunakan.' } },
        { status: 409 }
      );
    }

    // Validate active kos must have coordinates
    if (data.isActive && (!data.latitude || !data.longitude)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Kos aktif wajib memiliki koordinat.' } },
        { status: 400 }
      );
    }

    const normalizedWa = normalizeIndonesianWhatsapp(data.ownerWhatsapp);

    const conn = await getConnection();
    try {
      const [result] = await conn.execute(
        `INSERT INTO kos (name, slug, description, address, latitude, longitude, google_maps_url,
         gender_type, owner_name, owner_whatsapp, rules, is_active, is_featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.name, data.slug, data.description || null, data.address,
          data.latitude || null, data.longitude || null, data.googleMapsUrl || null,
          data.genderType, data.ownerName || null, normalizedWa,
          data.rules || null, data.isActive ? 1 : 0, data.isFeatured ? 1 : 0,
        ]
      );

      const kosId = (result as { insertId: number }).insertId;

      // Link facilities
      if (data.facilityIds && data.facilityIds.length > 0) {
        for (const fId of data.facilityIds) {
          await conn.execute('INSERT INTO kos_facilities (kos_id, facility_id) VALUES (?, ?)', [kosId, fId]);
        }
      }

      // Add photos
      if (data.photos && data.photos.length > 0) {
        for (let i = 0; i < data.photos.length; i++) {
          const p = data.photos[i];
          await conn.execute(
            'INSERT INTO kos_photos (kos_id, image_path, is_cover, sort_order) VALUES (?, ?, ?, ?)',
            [kosId, p.url, p.isCover ? 1 : 0, i + 1]
          );
        }
      }

      conn.release();
      return NextResponse.json({ success: true, data: { id: kosId } }, { status: 201 });
    } catch (err) {
      conn.release();
      throw err;
    }
  } catch (error) {
    return adminErrorResponse(error);
  }
}
