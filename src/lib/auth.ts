import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query } from './db';
import type { Admin } from '@/types/database';

const COOKIE_NAME = 'kos_admin_session';
const MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

export interface AdminPayload {
  adminId: number;
  username: string;
}

export async function createAdminSession(admin: Pick<Admin, 'id' | 'username'>) {
  const secret = getJwtSecret();

  const token = await new SignJWT({
    adminId: admin.id,
    username: admin.username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
    path: '/',
  });

  return token;
}

export async function getAdminSession(): Promise<AdminPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    if (!payload.adminId || !payload.username) return null;

    return {
      adminId: payload.adminId as number,
      username: payload.username as string,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<AdminPayload> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }

  // Verify admin still exists in database
  const admins = await query<Admin[]>(
    'SELECT id, username FROM admins WHERE id = ?',
    [session.adminId]
  );

  if (!admins || admins.length === 0) {
    throw new Error('UNAUTHORIZED');
  }

  return session;
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function adminErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === 'UNAUTHORIZED') {
    return Response.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Anda harus login sebagai admin.' },
      },
      { status: 401 }
    );
  }
  console.error('Admin API Error:', error);
  return Response.json(
    {
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan server.' },
    },
    { status: 500 }
  );
}
