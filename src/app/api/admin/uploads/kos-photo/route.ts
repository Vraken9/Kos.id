import { NextRequest, NextResponse } from 'next/server';
import { query, getConnection } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { saveUploadedFile, UploadError } from '@/lib/files';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const kosId = formData.get('kosId') as string;
    const roomTypeId = formData.get('roomTypeId') as string | null;
    const isCover = formData.get('isCover') === 'true';
    const altText = formData.get('altText') as string || null;

    if (!image) {
      return NextResponse.json(
        { success: false, error: { code: 'UPLOAD_ERROR', message: 'File wajib.' } },
        { status: 400 }
      );
    }

    const uploadResult = await saveUploadedFile(image, 'kos', 10 * 1024 * 1024);

    return NextResponse.json({
      success: true,
      data: { imagePath: uploadResult.relativePath },
    }, { status: 201 });
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
