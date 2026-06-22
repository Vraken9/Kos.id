import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import type { Admin } from '@/types/database';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Belum login.' } },
        { status: 401 }
      );
    }

    const admin = await queryOne<Admin>(
      'SELECT id, username, name FROM admins WHERE id = ?',
      [session.adminId]
    );

    if (!admin) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin tidak ditemukan.' } },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { admin: { id: admin.id, username: admin.username, name: admin.name } },
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server.' } },
      { status: 500 }
    );
  }
}
