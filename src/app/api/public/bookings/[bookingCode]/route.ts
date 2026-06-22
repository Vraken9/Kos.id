import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import type { Booking, PaymentProof } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingCode: string }> }
) {
  try {
    const { bookingCode } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Link booking tidak valid atau sudah tidak bisa diakses.' } },
        { status: 404 }
      );
    }

    // Find booking by code and validate token
    const booking = await queryOne<Booking>(
      'SELECT * FROM bookings WHERE booking_code = ? AND access_token = ?',
      [bookingCode, token]
    );

    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Link booking tidak valid atau sudah tidak bisa diakses.' } },
        { status: 404 }
      );
    }

    // Get latest payment proof
    const paymentProof = await queryOne<PaymentProof>(
      'SELECT * FROM payment_proofs WHERE booking_id = ? AND is_active = 1 ORDER BY uploaded_at DESC LIMIT 1',
      [booking.id]
    );

    // Get QRIS settings
    const settings = await queryOne<Record<string, unknown>>(
      'SELECT qris_image_path, payment_receiver_name, payment_instructions FROM app_settings WHERE id = 1'
    );

    // Get status logs
    const statusLogs = await query<Record<string, unknown>[]>(
      'SELECT old_status, new_status, note, created_at FROM booking_status_logs WHERE booking_id = ? ORDER BY created_at ASC',
      [booking.id]
    );

    return NextResponse.json({
      success: true,
      data: {
        bookingCode: booking.booking_code,
        status: booking.status,
        customerName: booking.customer_name,
        customerWhatsapp: booking.customer_whatsapp,
        plannedCheckinDate: booking.planned_checkin_date,
        customerNote: booking.customer_note,
        paymentAmount: booking.payment_amount,
        kosName: booking.snapshot_kos_name,
        kosAddress: booking.snapshot_kos_address,
        roomTypeName: booking.snapshot_room_type_name,
        ownerWhatsapp: booking.snapshot_owner_whatsapp,
        adminNote: booking.admin_note,
        confirmedAt: booking.confirmed_at,
        createdAt: booking.created_at,
        paymentProof: paymentProof ? {
          imageUrl: paymentProof.image_path,
          uploadedAt: paymentProof.uploaded_at,
        } : null,
        qris: settings ? {
          imageUrl: settings.qris_image_path,
          receiverName: settings.payment_receiver_name,
          instructions: settings.payment_instructions,
        } : null,
        statusLogs,
        receiptAvailable: booking.status === 'confirmed',
      },
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server.' } },
      { status: 500 }
    );
  }
}
