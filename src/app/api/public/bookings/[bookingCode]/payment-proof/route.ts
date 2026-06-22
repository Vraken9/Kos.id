import { NextRequest, NextResponse } from 'next/server';
import { queryOne, getConnection } from '@/lib/db';
import { saveUploadedFile, UploadError } from '@/lib/files';
import type { Booking } from '@/types/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingCode: string }> }
) {
  try {
    const { bookingCode } = await params;
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const proofImage = formData.get('proofImage') as File | null;

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Link booking tidak valid.' } },
        { status: 404 }
      );
    }

    // Validate booking and token
    const booking = await queryOne<Booking>(
      'SELECT * FROM bookings WHERE booking_code = ? AND access_token = ?',
      [bookingCode, token]
    );

    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Link booking tidak valid.' } },
        { status: 404 }
      );
    }

    // Check status allows upload
    if (!['waiting_payment', 'rejected'].includes(booking.status)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Upload bukti pembayaran tidak dapat dilakukan pada status ini.' } },
        { status: 400 }
      );
    }

    if (!proofImage || !(proofImage instanceof File)) {
      return NextResponse.json(
        { success: false, error: { code: 'UPLOAD_ERROR', message: 'File bukti pembayaran wajib diupload.' } },
        { status: 400 }
      );
    }

    // Save file
    const uploadResult = await saveUploadedFile(proofImage, 'payment-proofs', 2 * 1024 * 1024);

    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      // Deactivate old proofs
      await conn.execute(
        'UPDATE payment_proofs SET is_active = 0 WHERE booking_id = ?',
        [booking.id]
      );

      // Insert new proof
      await conn.execute(
        `INSERT INTO payment_proofs (booking_id, image_path, original_filename, mime_type, file_size, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [booking.id, uploadResult.relativePath, uploadResult.originalFilename, uploadResult.mimeType, uploadResult.fileSize]
      );

      // Update booking status
      const oldStatus = booking.status;
      await conn.execute(
        "UPDATE bookings SET status = 'waiting_confirmation' WHERE id = ?",
        [booking.id]
      );

      // Log status change
      await conn.execute(
        `INSERT INTO booking_status_logs (booking_id, old_status, new_status, note)
         VALUES (?, ?, 'waiting_confirmation', 'Bukti pembayaran diupload')`,
        [booking.id, oldStatus]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return NextResponse.json({
      success: true,
      data: {
        status: 'waiting_confirmation',
        proofImageUrl: uploadResult.relativePath,
      },
    });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 400 }
      );
    }
    console.error('Error uploading payment proof:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server.' } },
      { status: 500 }
    );
  }
}
