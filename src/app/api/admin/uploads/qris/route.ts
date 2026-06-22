import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { saveUploadedFile, UploadError } from '@/lib/files';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const qrisImage = formData.get('qrisImage') as File | null;

    if (!qrisImage) {
      return NextResponse.json(
        { success: false, error: { code: 'UPLOAD_ERROR', message: 'File QRIS wajib.' } },
        { status: 400 }
      );
    }

    const uploadResult = await saveUploadedFile(qrisImage, 'qris', 2 * 1024 * 1024);

    await query(
      'UPDATE app_settings SET qris_image_path = ? WHERE id = 1',
      [uploadResult.relativePath]
    );

    return NextResponse.json({
      success: true,
      data: { qrisImageUrl: uploadResult.relativePath },
    });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 400 }
      );
    }
    return adminErrorResponse(error);
  }
}
