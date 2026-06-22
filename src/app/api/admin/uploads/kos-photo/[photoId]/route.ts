import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { deleteUploadedFile } from '@/lib/files';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    await requireAdmin();
    const { photoId } = await params;

    const photo = await queryOne<{ image_path: string }>('SELECT image_path FROM kos_photos WHERE id = ?', [photoId]);
    if (photo) {
      await deleteUploadedFile(photo.image_path);
      await query('DELETE FROM kos_photos WHERE id = ?', [photoId]);
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
