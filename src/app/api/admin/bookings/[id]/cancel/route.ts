import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { bookingCancelSchema } from '@/lib/validation';
import type { Booking } from '@/types/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = bookingCancelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Catatan admin wajib diisi saat cancel.' } },
        { status: 400 }
      );
    }

    const { adminNote } = parsed.data;
    const conn = await getConnection();

    try {
      await conn.beginTransaction();

      // Lock booking
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

      const cancellableStatuses = ['waiting_payment', 'waiting_confirmation', 'confirmed', 'rejected'];
      if (!cancellableStatuses.includes(booking.status)) {
        await conn.rollback();
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Booking tidak dapat dibatalkan dari status ini.' } },
          { status: 400 }
        );
      }

      // If previously confirmed, restore stock
      if (booking.status === 'confirmed') {
        await conn.execute(
          'UPDATE room_types SET stock_available = stock_available + 1 WHERE id = ?',
          [booking.room_type_id]
        );
      }

      await conn.execute(
        `UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), admin_note = ? WHERE id = ?`,
        [adminNote, id]
      );

      await conn.execute(
        `INSERT INTO booking_status_logs (booking_id, old_status, new_status, note, changed_by_admin_id)
         VALUES (?, ?, 'cancelled', ?, ?)`,
        [id, booking.status, adminNote, admin.adminId]
      );

      await conn.commit();
      conn.release();

      return NextResponse.json({ success: true, data: { status: 'cancelled' } });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  } catch (error) {
    return adminErrorResponse(error);
  }
}
