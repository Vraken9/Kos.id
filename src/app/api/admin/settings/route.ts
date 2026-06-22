import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { campusSettingsSchema, paymentSettingsSchema, passwordChangeSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import type { AppSettings, Admin } from '@/types/database';

export async function GET() {
  try {
    await requireAdmin();
    const settings = await queryOne<AppSettings>('SELECT * FROM app_settings WHERE id = 1');
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
