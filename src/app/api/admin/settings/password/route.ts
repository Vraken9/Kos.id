import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { passwordChangeSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import type { Admin } from '@/types/database';

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const parsed = passwordChangeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Data tidak valid', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const admin = await queryOne<Admin>('SELECT * FROM admins WHERE id = ?', [session.adminId]);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Admin tidak ditemukan.' } },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Password saat ini salah.' } },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE admins SET password_hash = ? WHERE id = ?', [newHash, session.adminId]);

    return NextResponse.json({ success: true, data: { updated: true } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
