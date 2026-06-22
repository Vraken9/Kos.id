import { NextRequest, NextResponse } from 'next/server';
import { queryOne, getConnection } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { bookingConfirmSchema } from '@/lib/validation';
import type { Booking, RoomType } from '@/types/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = bookingConfirmSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Data tidak valid.' } },
        { status: 400 }
      );
    }

    const { adminNote } = parsed.data;
    const conn = await getConnection();

    try {
      await conn.beginTransaction();

      // Lock booking row
      const [bookingRows] = await conn.execute(
        'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
        [id]
      );
      const booking = (bookingRows as Booking[])[0];

      if (!booking) {
        await conn.rollback();
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Booking tidak ditemukan.' } },
          { status: 404 }
        );
      }

      if (booking.status !== 'waiting_confirmation') {
        await conn.rollback();
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Booking tidak dalam status menunggu konfirmasi.' } },
          { status: 400 }
        );
      }

      // Lock room type and check stock
      const [rtRows] = await conn.execute(
        'SELECT * FROM room_types WHERE id = ? FOR UPDATE',
        [booking.room_type_id]
      );
      const roomType = (rtRows as RoomType[])[0];

      if (!roomType || roomType.stock_available <= 0) {
        await conn.rollback();
        return NextResponse.json(
          { success: false, error: { code: 'OUT_OF_STOCK', message: 'Stok kamar sudah habis. Booking tidak dapat dikonfirmasi.' } },
          { status: 409 }
        );
      }

      // Reduce stock
      await conn.execute(
        'UPDATE room_types SET stock_available = stock_available - 1 WHERE id = ?',
        [booking.room_type_id]
      );

      // Update booking
      await conn.execute(
        `UPDATE bookings SET status = 'confirmed', confirmed_by_admin_id = ?, confirmed_at = NOW(), admin_note = ? WHERE id = ?`,
        [admin.adminId, adminNote || null, id]
      );

      // Log
      await conn.execute(
        `INSERT INTO booking_status_logs (booking_id, old_status, new_status, note, changed_by_admin_id)
         VALUES (?, 'waiting_confirmation', 'confirmed', ?, ?)`,
        [id, adminNote || 'Pembayaran dikonfirmasi', admin.adminId]
      );

      await conn.commit();
      conn.release();

      return NextResponse.json({ success: true, data: { status: 'confirmed' } });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  } catch (error) {
    return adminErrorResponse(error);
  }
}
