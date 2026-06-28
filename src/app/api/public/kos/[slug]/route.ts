import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { calculateDistanceKm } from '@/lib/distance';
import type { AppSettings, Kos, RoomType, Facility, KosPhoto } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get kos
    const kos = await queryOne<Kos>(
      'SELECT * FROM kos WHERE slug = ? AND is_active = 1',
      [slug]
    );

    if (!kos) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Kos tidak ditemukan.' } },
        { status: 404 }
      );
    }

    // Get campus settings
    const settings = await queryOne<AppSettings>(
      'SELECT * FROM app_settings WHERE id = 1'
    );

    // Calculate distance
    let distanceKm: number | null = null;
    if (kos.latitude && kos.longitude && settings?.campus_latitude && settings?.campus_longitude) {
      distanceKm = calculateDistanceKm(
        Number(settings.campus_latitude),
        Number(settings.campus_longitude),
        Number(kos.latitude),
        Number(kos.longitude)
      );
    }

    // Get photos
    const photos = await query<KosPhoto[]>(
      'SELECT * FROM kos_photos WHERE kos_id = ? ORDER BY is_cover DESC, sort_order ASC',
      [kos.id]
    );

    // Get kos facilities
    const facilities = await query<Facility[]>(
      `SELECT f.* FROM facilities f
       JOIN kos_facilities kf ON kf.facility_id = f.id
       WHERE kf.kos_id = ? AND f.is_active = 1`,
      [kos.id]
    );

    // Get room types with their facilities and photos
    const roomTypes = await query<RoomType[]>(
      'SELECT * FROM room_types WHERE kos_id = ? AND is_active = 1 ORDER BY price_monthly ASC',
      [kos.id]
    );

    const roomTypesWithDetails = await Promise.all(
      roomTypes.map(async (rt) => {
        const rtFacilities = await query<Facility[]>(
          `SELECT f.* FROM facilities f
           JOIN room_type_facilities rtf ON rtf.facility_id = f.id
           WHERE rtf.room_type_id = ? AND f.is_active = 1`,
          [rt.id]
        );
        const rtPhotos = await query<KosPhoto[]>(
          'SELECT * FROM kos_photos WHERE room_type_id = ? ORDER BY sort_order ASC',
          [rt.id]
        );
        return { ...rt, facilities: rtFacilities, photos: rtPhotos };
      })
    );

    // Cover image
    const coverPhoto = photos.find((p) => p.is_cover === 1);

    return NextResponse.json({
      success: true,
      data: {
        ...kos,
        distanceKm,
        coverImageUrl: coverPhoto?.image_path || null,
        photos,
        facilities,
        roomTypes: roomTypesWithDetails,
        campus: settings ? {
          name: settings.campus_name,
          address: settings.campus_address,
          latitude: settings.campus_latitude ? Number(settings.campus_latitude) : null,
          longitude: settings.campus_longitude ? Number(settings.campus_longitude) : null,
          googleMapsUrl: settings.campus_google_maps_url,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching kos detail:', error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: `Server Error: ${errMessage}` } },
      { status: 500 }
    );
  }
}
