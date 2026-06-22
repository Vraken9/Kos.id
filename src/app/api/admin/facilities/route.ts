import { NextRequest, NextResponse } from 'next/server';
import { query, getConnection } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { facilityCreateSchema } from '@/lib/validation';

export async function GET() {
  try {
    await requireAdmin();
    const facilities = await query<Record<string, unknown>[]>(
      'SELECT * FROM facilities ORDER BY created_at ASC'
    );
    return NextResponse.json({ success: true, data: facilities });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = facilityCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Data tidak valid', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const conn = await getConnection();
    try {
      const [result] = await conn.execute(
        'INSERT INTO facilities (name, slug, scope, icon_key) VALUES (?, ?, ?, ?)',
        [data.name, data.slug, data.scope, data.iconKey || null]
      );
      const id = (result as { insertId: number }).insertId;
      conn.release();
      return NextResponse.json({ success: true, data: { id } }, { status: 201 });
    } catch (err) {
      conn.release();
      throw err;
    }
  } catch (error) {
    return adminErrorResponse(error);
  }
}
