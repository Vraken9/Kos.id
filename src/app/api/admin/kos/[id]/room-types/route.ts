import { NextRequest, NextResponse } from 'next/server';
import { query, getConnection, queryOne } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { roomTypeCreateSchema } from '@/lib/validation';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const resolvedParams = await params;
    const kosId = parseInt(resolvedParams.id, 10);
    if (isNaN(kosId)) {
      return NextResponse.json({ success: false, error: { message: 'ID Kos tidak valid' } }, { status: 400 });
    }

    const roomTypes = await query<Record<string, unknown>[]>(
      `SELECT rt.*, 
        (
          SELECT JSON_ARRAYAGG(JSON_OBJECT('id', f.id, 'name', f.name))
          FROM room_type_facilities rtf
          JOIN facilities f ON rtf.facility_id = f.id
          WHERE rtf.room_type_id = rt.id
        ) as facilities
       FROM room_types rt
       WHERE rt.kos_id = ?
       ORDER BY rt.created_at ASC`,
      [kosId]
    );

    return NextResponse.json({ success: true, data: roomTypes });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const resolvedParams = await params;
    const kosId = parseInt(resolvedParams.id, 10);
    if (isNaN(kosId)) {
      return NextResponse.json({ success: false, error: { message: 'ID Kos tidak valid' } }, { status: 400 });
    }

    const body = await request.json();
    const parsed = roomTypeCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Data tidak valid', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify kos exists
    const kos = await queryOne<{ id: number }>('SELECT id FROM kos WHERE id = ?', [kosId]);
    if (!kos) {
      return NextResponse.json({ success: false, error: { message: 'Kos tidak ditemukan' } }, { status: 404 });
    }

    const conn = await getConnection();
    try {
      const [result] = await conn.execute(
        `INSERT INTO room_types (kos_id, name, description, price_monthly, stock_total, stock_available, room_size, bathroom_type, electricity_type, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [kosId, data.name, data.description || null, data.priceMonthly, data.stockTotal, data.stockAvailable, data.roomSize || null, data.bathroomType, data.electricityType, data.isActive ? 1 : 0]
      );

      const roomTypeId = (result as { insertId: number }).insertId;

      if (data.facilityIds && data.facilityIds.length > 0) {
        for (const fId of data.facilityIds) {
          await conn.execute('INSERT INTO room_type_facilities (room_type_id, facility_id) VALUES (?, ?)', [roomTypeId, fId]);
        }
      }

      conn.release();
      return NextResponse.json({ success: true, data: { id: roomTypeId } }, { status: 201 });
    } catch (err) {
      conn.release();
      throw err;
    }
  } catch (error) {
    return adminErrorResponse(error);
  }
}
