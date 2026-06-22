import { NextRequest, NextResponse } from 'next/server';
import { query, getConnection } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const conn = await getConnection();
    try {
      const [bookings] = await conn.execute(
        'SELECT id, status, room_type_id FROM bookings WHERE id = ? FOR UPDATE',
        [id]
      );
      
      const bks = bookings as { id: number; status: string; room_type_id: number }[];
      
      if (bks.length === 0) {
        conn.release();
        return NextResponse.json({ success: false, error: { message: 'Booking tidak ditemukan.' } }, { status: 404 });
      }
      
      const booking = bks[0];
      
      if (booking.status !== 'confirmed') {
        conn.release();
        return NextResponse.json({ success: false, error: { message: 'Hanya pesanan berstatus Confirmed yang bisa diselesaikan/checkout.' } }, { status: 400 });
      }

      // Update status to expired
      await conn.execute(
        'UPDATE bookings SET status = ? WHERE id = ?',
        ['expired', booking.id]
      );

      // Restore room stock
      await conn.execute(
        'UPDATE room_types SET stock_available = stock_available + 1 WHERE id = ?',
        [booking.room_type_id]
      );

      // Add log
      await conn.execute(
        `INSERT INTO booking_status_logs (booking_id, old_status, new_status, changed_by_admin_id, note)
         VALUES (?, ?, ?, ?, ?)`,
        [booking.id, booking.status, 'expired', admin.adminId, 'Sewa Selesai (Check-out/Expired)']
      );

      conn.release();
      return NextResponse.json({ success: true, data: { status: 'expired' } });
    } catch (err) {
      conn.release();
      throw err;
    }
  } catch (error) {
    return adminErrorResponse(error);
  }
}
