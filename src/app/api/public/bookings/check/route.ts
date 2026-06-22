import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingCode, customerWhatsapp } = body;

    if (!bookingCode || !customerWhatsapp) {
      return NextResponse.json(
        { success: false, error: { message: 'Kode Booking dan Nomor WhatsApp wajib diisi.' } },
        { status: 400 }
      );
    }

    // Clean up inputs
    const code = String(bookingCode).trim();
    const wa = String(customerWhatsapp).replace(/\D/g, ''); // strip non-numeric

    // Search booking
    const booking = await queryOne<{ booking_code: string; access_token: string; customer_whatsapp: string }>(
      'SELECT booking_code, access_token, customer_whatsapp FROM bookings WHERE booking_code = ?',
      [code]
    );

    if (!booking) {
      return NextResponse.json(
        { success: false, error: { message: 'Pesanan tidak ditemukan.' } },
        { status: 404 }
      );
    }

    // Verify WhatsApp (exact match after stripping formatting, or loose matching)
    // Here we do a loose match (ends with) to handle "08", "628", "+62" variations
    const dbWa = booking.customer_whatsapp.replace(/\D/g, '');
    
    // Check if the provided WA is a suffix of DB WA or vice versa, to handle '08' vs '628' differences easily
    if (dbWa.endsWith(wa.slice(1)) || wa.endsWith(dbWa.slice(1))) {
      return NextResponse.json({
        success: true,
        data: {
          bookingCode: booking.booking_code,
          token: booking.access_token,
        }
      });
    }

    return NextResponse.json(
      { success: false, error: { message: 'Nomor WhatsApp tidak sesuai dengan pesanan.' } },
      { status: 403 }
    );
    
  } catch (error) {
    console.error('Check booking error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Terjadi kesalahan internal server' } },
      { status: 500 }
    );
  }
}
