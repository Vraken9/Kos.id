import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') || '';
    const q = searchParams.get('q') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      conditions.push('b.status = ?');
      params.push(status);
    }
    if (q) {
      conditions.push('(b.booking_code LIKE ? OR b.customer_name LIKE ? OR b.customer_whatsapp LIKE ? OR b.snapshot_kos_name LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (dateFrom) {
      conditions.push('DATE(b.created_at) >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push('DATE(b.created_at) <= ?');
      params.push(dateTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await query<Record<string, unknown>[]>(
      `SELECT b.*, pp.image_path as payment_proof_url 
       FROM bookings b 
       LEFT JOIN payment_proofs pp ON pp.booking_id = b.id AND pp.is_active = 1
       ${whereClause} 
       ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const countResult = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM bookings b ${whereClause}`,
      params
    );

    return NextResponse.json({
      success: true,
      data: {
        items: rows,
        pagination: {
          page, limit,
          total: countResult?.total || 0,
          totalPages: Math.ceil((countResult?.total || 0) / limit),
        },
      },
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
