import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, getConnection } from '@/lib/db';
import { bookingCreateSchema } from '@/lib/validation';
import { normalizeIndonesianWhatsapp, isValidIndonesianPhone } from '@/lib/phone';
import { generateBookingCode, generateAccessToken } from '@/lib/booking-code';
import type { Kos, RoomType } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bookingCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Data tidak valid',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate WhatsApp
    if (!isValidIndonesianPhone(data.customerWhatsapp)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Nomor WhatsApp tidak valid.' },
        },
        { status: 400 }
      );
    }

    // Normalize WhatsApp
    const normalizedWa = normalizeIndonesianWhatsapp(data.customerWhatsapp);

    // Check kos exists and active
    const kos = await queryOne<Kos>(
      'SELECT * FROM kos WHERE id = ? AND is_active = 1',
      [data.kosId]
    );
    if (!kos) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Kos tidak ditemukan atau tidak aktif.' } },
        { status: 404 }
      );
    }

    // Check room type exists, active, belongs to kos, and has stock
    const roomType = await queryOne<RoomType>(
      'SELECT * FROM room_types WHERE id = ? AND kos_id = ? AND is_active = 1',
      [data.roomTypeId, data.kosId]
    );
    if (!roomType) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tipe kamar tidak ditemukan atau tidak aktif.' } },
        { status: 404 }
      );
    }

    if (roomType.stock_available <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'OUT_OF_STOCK', message: 'Stok kamar sudah habis.' } },
        { status: 409 }
      );
    }

    // Generate booking code and access token
    let bookingCode = generateBookingCode();
    const accessToken = generateAccessToken();

    // Ensure booking code is unique
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM bookings WHERE booking_code = ?',
      [bookingCode]
    );
    if (existing) {
      bookingCode = generateBookingCode(); // try once more
    }

    // Create booking (stock NOT reduced yet)
    const conn = await getConnection();
    try {
      await conn.execute(
        `INSERT INTO bookings (
          booking_code, access_token, kos_id, room_type_id,
          customer_name, customer_whatsapp, planned_checkin_date, customer_note,
          status, payment_amount,
          snapshot_kos_name, snapshot_kos_address, snapshot_room_type_name, snapshot_owner_whatsapp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'waiting_payment', ?, ?, ?, ?, ?)`,
        [
          bookingCode,
          accessToken,
          data.kosId,
          data.roomTypeId,
          data.customerName,
          normalizedWa,
          data.plannedCheckinDate,
          data.customerNote || null,
          roomType.price_monthly,
          kos.name,
          kos.address,
          roomType.name,
          kos.owner_whatsapp,
        ]
      );

      // Insert status log
      const bookings = await query<{ id: number }[]>(
        'SELECT id FROM bookings WHERE booking_code = ?',
        [bookingCode]
      );
      if (bookings.length > 0) {
        await conn.execute(
          `INSERT INTO booking_status_logs (booking_id, old_status, new_status, note)
           VALUES (?, NULL, 'waiting_payment', 'Booking dibuat')`,
          [bookings[0].id]
        );
      }
    } finally {
      conn.release();
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingCode,
        accessToken,
        status: 'waiting_payment',
        paymentAmount: roomType.price_monthly,
        statusUrl: `/booking/${bookingCode}?token=${accessToken}`,
      },
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server.' } },
      { status: 500 }
    );
  }
}
