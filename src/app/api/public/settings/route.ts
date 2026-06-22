import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import type { AppSettings } from '@/types/database';

export async function GET() {
  try {
    const settings = await queryOne<AppSettings>(
      'SELECT * FROM app_settings WHERE id = 1'
    );

    if (!settings) {
      return NextResponse.json({
        success: true,
        data: { campus: null, payment: null },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        campus: {
          name: settings.campus_name,
          address: settings.campus_address,
          latitude: settings.campus_latitude ? Number(settings.campus_latitude) : null,
          longitude: settings.campus_longitude ? Number(settings.campus_longitude) : null,
          googleMapsUrl: settings.campus_google_maps_url,
        },
        payment: {
          qrisImageUrl: settings.qris_image_path,
          receiverName: settings.payment_receiver_name,
          paymentInstructions: settings.payment_instructions,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server.' } },
      { status: 500 }
    );
  }
}
