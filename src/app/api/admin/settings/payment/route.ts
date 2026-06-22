import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { paymentSettingsSchema } from '@/lib/validation';

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = paymentSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Data tidak valid' } },
        { status: 400 }
      );
    }

    const data = parsed.data;
    await query(
      `UPDATE app_settings SET payment_receiver_name = ?, payment_instructions = ? WHERE id = 1`,
      [data.receiverName || null, data.paymentInstructions || null]
    );

    return NextResponse.json({ success: true, data: { updated: true } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
