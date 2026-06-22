import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { facilityUpdateSchema } from '@/lib/validation';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = facilityUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Data tidak valid' } },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updates: string[] = [];
    const updateParams: any[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); updateParams.push(data.name); }
    if (data.slug !== undefined) { updates.push('slug = ?'); updateParams.push(data.slug); }
    if (data.scope !== undefined) { updates.push('scope = ?'); updateParams.push(data.scope); }
    if (data.iconKey !== undefined) { updates.push('icon_key = ?'); updateParams.push(data.iconKey || null); }

    if (updates.length > 0) {
      await query(`UPDATE facilities SET ${updates.join(', ')} WHERE id = ?`, [...updateParams, id]);
    }

    return NextResponse.json({ success: true, data: { id: Number(id) } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Soft delete
    await query('UPDATE facilities SET is_active = 0 WHERE id = ?', [id]);
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
