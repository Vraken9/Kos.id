import { NextRequest, NextResponse } from 'next/server';
import { query, getConnection } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];

    if (typeof body.is_active === 'boolean') {
      updates.push('is_active = ?');
      values.push(body.is_active ? 1 : 0);
    }

    if (typeof body.is_featured === 'boolean') {
      updates.push('is_featured = ?');
      values.push(body.is_featured ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: { message: 'Tidak ada data untuk diubah' } }, { status: 400 });
    }

    values.push(id);

    await query(`UPDATE kos SET ${updates.join(', ')} WHERE id = ?`, values);

    return NextResponse.json({ success: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
