import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { loginSchema } from '@/lib/validation';
import { createAdminSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import type { Admin } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Username atau password salah.' } },
        { status: 401 }
      );
    }

    const { username, password } = parsed.data;

    const admin = await queryOne<Admin>(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );

    if (!admin) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Username atau password salah.' } },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Username atau password salah.' } },
        { status: 401 }
      );
    }

    await createAdminSession({ id: admin.id, username: admin.username });

    return NextResponse.json({
      success: true,
      data: {
        admin: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server.' } },
      { status: 500 }
    );
  }
}
