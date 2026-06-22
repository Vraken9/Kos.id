import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import type { Booking, PaymentProof } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const booking = await queryOne<Booking>('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking tidak ditemukan.' } },
        { status: 404 }
      );
    }

    const paymentProofs = await query<PaymentProof[]>(
      'SELECT * FROM payment_proofs WHERE booking_id = ? ORDER BY uploaded_at DESC',
      [id]
    );

    const statusLogs = await query<Record<string, unknown>[]>(
      'SELECT * FROM booking_status_logs WHERE booking_id = ? ORDER BY created_at ASC',
      [id]
    );

    return NextResponse.json({
      success: true,
      data: { ...booking, paymentProofs, statusLogs },
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
