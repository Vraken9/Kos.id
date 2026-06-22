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

    if (!image || !kosId) {
      return NextResponse.json(
        { success: false, error: { code: 'UPLOAD_ERROR', message: 'File dan kosId wajib.' } },
        { status: 400 }
      );
    }

    const uploadResult = await saveUploadedFile(image, 'kos', 3 * 1024 * 1024);

    const conn = await getConnection();
    try {
      // If isCover, unset existing covers
      if (isCover) {
        await conn.execute('UPDATE kos_photos SET is_cover = 0 WHERE kos_id = ? AND is_cover = 1', [kosId]);
      }

      const [result] = await conn.execute(
        `INSERT INTO kos_photos (kos_id, room_type_id, image_path, alt_text, is_cover, sort_order)
         VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM kos_photos kp2 WHERE kp2.kos_id = ?))`,
        [kosId, roomTypeId || null, uploadResult.relativePath, altText, isCover ? 1 : 0, kosId]
      );

      const photoId = (result as { insertId: number }).insertId;
      conn.release();

      return NextResponse.json({
        success: true,
        data: { id: photoId, imagePath: uploadResult.relativePath },
      }, { status: 201 });
    } catch (err) {
      conn.release();
      throw err;
    }
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
