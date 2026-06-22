import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { campusSettingsSchema } from '@/lib/validation';

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = campusSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Data tidak valid', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const data = parsed.data;
    await query(
      `UPDATE app_settings SET campus_name = ?, campus_address = ?, campus_latitude = ?, campus_longitude = ?, campus_google_maps_url = ? WHERE id = 1`,
      [data.name, data.address || null, data.latitude || null, data.longitude || null, data.googleMapsUrl || null]
    );

    return NextResponse.json({ success: true, data: { updated: true } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
