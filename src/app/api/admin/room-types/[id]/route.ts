import { NextRequest, NextResponse } from 'next/server';
import { query, getConnection, queryOne } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { roomTypeUpdateSchema } from '@/lib/validation';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: { message: 'ID Tipe Kamar tidak valid' } }, { status: 400 });
    }

    const body = await request.json();
    const parsed = roomTypeUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Data tidak valid', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existing = await queryOne<{ id: number }>('SELECT id FROM room_types WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ success: false, error: { message: 'Tipe kamar tidak ditemukan' } }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description || null); }
    if (data.priceMonthly !== undefined) { updates.push('price_monthly = ?'); values.push(data.priceMonthly); }
    if (data.stockTotal !== undefined) { updates.push('stock_total = ?'); values.push(data.stockTotal); }
    if (data.stockAvailable !== undefined) { updates.push('stock_available = ?'); values.push(data.stockAvailable); }
    if (data.roomSize !== undefined) { updates.push('room_size = ?'); values.push(data.roomSize || null); }
    if (data.bathroomType !== undefined) { updates.push('bathroom_type = ?'); values.push(data.bathroomType); }
    if (data.electricityType !== undefined) { updates.push('electricity_type = ?'); values.push(data.electricityType); }
    if (data.isActive !== undefined) { updates.push('is_active = ?'); values.push(data.isActive ? 1 : 0); }

    const conn = await getConnection();
    try {
      if (updates.length > 0) {
        values.push(id);
        await conn.execute(`UPDATE room_types SET ${updates.join(', ')} WHERE id = ?`, values);
      }

      if (data.facilityIds !== undefined) {
        await conn.execute('DELETE FROM room_type_facilities WHERE room_type_id = ?', [id]);
        for (const fId of data.facilityIds) {
          await conn.execute('INSERT INTO room_type_facilities (room_type_id, facility_id) VALUES (?, ?)', [id, fId]);
        }
      }

      conn.release();
      return NextResponse.json({ success: true, message: 'Tipe kamar berhasil diperbarui' });
    } catch (err) {
      conn.release();
      throw err;
    }
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: { message: 'ID Tipe Kamar tidak valid' } }, { status: 400 });
    }

    // Check if room is used in bookings
    const bookingsCount = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM bookings WHERE room_type_id = ?',
      [id]
    );

    if (bookingsCount && bookingsCount.count > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Tipe kamar tidak bisa dihapus karena memiliki riwayat pemesanan.' } },
        { status: 409 }
      );
    }

    await query('DELETE FROM room_types WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Tipe kamar berhasil dihapus' });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
