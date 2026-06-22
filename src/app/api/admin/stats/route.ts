import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();

    const stats = await queryOne<Record<string, unknown>>(`
      SELECT 
        (SELECT COUNT(*) FROM kos WHERE is_active = 1) AS total_kos_active,
        (SELECT COUNT(*) FROM room_types WHERE is_active = 1) AS total_room_types_active,
        (SELECT COALESCE(SUM(stock_available), 0) FROM room_types WHERE is_active = 1) AS total_stock_available,
        (SELECT COUNT(*) FROM bookings WHERE status = 'waiting_confirmation') AS bookings_waiting,
        (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND MONTH(confirmed_at) = MONTH(NOW()) AND YEAR(confirmed_at) = YEAR(NOW())) AS bookings_confirmed_this_month
    `);

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
