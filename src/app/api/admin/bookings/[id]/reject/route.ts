import { NextRequest, NextResponse } from 'next/server';
import { queryOne, getConnection } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { bookingRejectSchema } from '@/lib/validation';
import type { Booking } from '@/types/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = bookingRejectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Catatan admin wajib diisi saat reject.' } },
        { status: 400 }
      );
    }

    const { adminNote } = parsed.data;

    const booking = await queryOne<Booking>('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking tidak ditemukan.' } },
        { status: 404 }
      );
    }

    if (booking.status !== 'waiting_confirmation') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Booking tidak dalam status menunggu konfirmasi.' } },
        { status: 400 }
      );
    }

    const conn = await getConnection();
    try {
      await conn.execute(
        `UPDATE bookings SET status = 'rejected', admin_note = ? WHERE id = ?`,
        [adminNote, id]
      );

      await conn.execute(
        `INSERT INTO booking_status_logs (booking_id, old_status, new_status, note, changed_by_admin_id)
         VALUES (?, 'waiting_confirmation', 'rejected', ?, ?)`,
        [id, adminNote, admin.adminId]
      );

      conn.release();
    } catch (err) {
      conn.release();
      throw err;
    }

    return NextResponse.json({ success: true, data: { status: 'rejected' } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
