import { NextRequest, NextResponse } from 'next/server';
import { query, getConnection } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { roomTypeUpdateSchema } from '@/lib/validation';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = roomTypeUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Data tidak valid', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const conn = await getConnection();
    try {
      const updates: string[] = [];
      const updateParams: any[] = [];

      if (data.name !== undefined) { updates.push('name = ?'); updateParams.push(data.name); }
      if (data.description !== undefined) { updates.push('description = ?'); updateParams.push(data.description || null); }
      if (data.priceMonthly !== undefined) { updates.push('price_monthly = ?'); updateParams.push(data.priceMonthly); }
      if (data.stockTotal !== undefined) { updates.push('stock_total = ?'); updateParams.push(data.stockTotal); }
      if (data.stockAvailable !== undefined) { updates.push('stock_available = ?'); updateParams.push(data.stockAvailable); }
      if (data.roomSize !== undefined) { updates.push('room_size = ?'); updateParams.push(data.roomSize || null); }
      if (data.bathroomType !== undefined) { updates.push('bathroom_type = ?'); updateParams.push(data.bathroomType); }
      if (data.electricityType !== undefined) { updates.push('electricity_type = ?'); updateParams.push(data.electricityType); }
      if (data.isActive !== undefined) { updates.push('is_active = ?'); updateParams.push(data.isActive ? 1 : 0); }

      if (updates.length > 0) {
        await conn.execute(`UPDATE room_types SET ${updates.join(', ')} WHERE id = ?`, [...updateParams, id]);
      }

      if (data.facilityIds !== undefined) {
        await conn.execute('DELETE FROM room_type_facilities WHERE room_type_id = ?', [id]);
        for (const fId of data.facilityIds) {
          await conn.execute('INSERT INTO room_type_facilities (room_type_id, facility_id) VALUES (?, ?)', [id, fId]);
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

    // Check if has bookings - soft delete if so
    const bookings = await query<{ id: number }[]>(
      'SELECT id FROM bookings WHERE room_type_id = ? LIMIT 1', [id]
    );

    if (bookings.length > 0) {
      await query('UPDATE room_types SET is_active = 0 WHERE id = ?', [id]);
    } else {
      await query('DELETE FROM room_types WHERE id = ?', [id]);
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
