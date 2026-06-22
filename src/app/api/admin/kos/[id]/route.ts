import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, getConnection } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { kosUpdateSchema } from '@/lib/validation';
import { normalizeIndonesianWhatsapp } from '@/lib/phone';
import type { Kos } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const kos = await queryOne<Kos>('SELECT * FROM kos WHERE id = ?', [id]);
    if (!kos) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Kos tidak ditemukan.' } },
        { status: 404 }
      );
    }

    // Get facilities
    const facilities = await query<{ id: number; name: string; slug: string }[]>(
      `SELECT f.id, f.name, f.slug FROM facilities f
       JOIN kos_facilities kf ON kf.facility_id = f.id WHERE kf.kos_id = ?`,
      [id]
    );

    // Get photos
    const photos = await query<Record<string, unknown>[]>(
      'SELECT * FROM kos_photos WHERE kos_id = ? ORDER BY is_cover DESC, sort_order ASC',
      [id]
    );

    return NextResponse.json({
      success: true,
      data: { ...kos, facilities, photos },
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = kosUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Data tidak valid', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const kos = await queryOne<Kos>('SELECT * FROM kos WHERE id = ?', [id]);
    if (!kos) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Kos tidak ditemukan.' } },
        { status: 404 }
      );
    }

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== kos.slug) {
      const existing = await queryOne<{ id: number }>('SELECT id FROM kos WHERE slug = ? AND id != ?', [data.slug, id]);
      if (existing) {
        return NextResponse.json(
          { success: false, error: { code: 'CONFLICT', message: 'Slug sudah digunakan.' } },
          { status: 409 }
        );
      }
    }

    const conn = await getConnection();
    try {
      const updates: string[] = [];
      const updateParams: any[] = [];

      if (data.name !== undefined) { updates.push('name = ?'); updateParams.push(data.name); }
      if (data.slug !== undefined) { updates.push('slug = ?'); updateParams.push(data.slug); }
      if (data.description !== undefined) { updates.push('description = ?'); updateParams.push(data.description || null); }
      if (data.address !== undefined) { updates.push('address = ?'); updateParams.push(data.address); }
      if (data.latitude !== undefined) { updates.push('latitude = ?'); updateParams.push(data.latitude); }
      if (data.longitude !== undefined) { updates.push('longitude = ?'); updateParams.push(data.longitude); }
      if (data.googleMapsUrl !== undefined) { updates.push('google_maps_url = ?'); updateParams.push(data.googleMapsUrl || null); }
      if (data.genderType !== undefined) { updates.push('gender_type = ?'); updateParams.push(data.genderType); }
      if (data.ownerName !== undefined) { updates.push('owner_name = ?'); updateParams.push(data.ownerName || null); }
      if (data.ownerWhatsapp !== undefined) { updates.push('owner_whatsapp = ?'); updateParams.push(normalizeIndonesianWhatsapp(data.ownerWhatsapp)); }
      if (data.rules !== undefined) { updates.push('rules = ?'); updateParams.push(data.rules || null); }
      if (data.isActive !== undefined) { updates.push('is_active = ?'); updateParams.push(data.isActive ? 1 : 0); }
      if (data.isFeatured !== undefined) { updates.push('is_featured = ?'); updateParams.push(data.isFeatured ? 1 : 0); }

      if (updates.length > 0) {
        await conn.execute(
          `UPDATE kos SET ${updates.join(', ')} WHERE id = ?`,
          [...updateParams, id]
        );
      }

      // Update facilities if provided
      if (data.facilityIds !== undefined) {
        await conn.execute('DELETE FROM kos_facilities WHERE kos_id = ?', [id]);
        for (const fId of data.facilityIds) {
          await conn.execute('INSERT INTO kos_facilities (kos_id, facility_id) VALUES (?, ?)', [id, fId]);
        }
      }

      conn.release();
    } catch (err) {
      conn.release();
      throw err;
    }

    return NextResponse.json({ success: true, data: { id: Number(id) } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Soft delete - set inactive
    await query('UPDATE kos SET is_active = 0 WHERE id = ?', [id]);

    return NextResponse.json({ success: true, data: { isActive: false } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
