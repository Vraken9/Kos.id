import { NextRequest, NextResponse } from 'next/server';
import { query, getConnection } from '@/lib/db';
import { requireAdmin, adminErrorResponse } from '@/lib/auth';
import { roomTypeCreateSchema } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: kosId } = await params;

    const roomTypes = await query<Record<string, unknown>[]>(
      `SELECT rt.*, 
        (SELECT GROUP_CONCAT(f.id) FROM room_type_facilities rtf JOIN facilities f ON f.id = rtf.facility_id WHERE rtf.room_type_id = rt.id) AS facility_ids
       FROM room_types rt WHERE rt.kos_id = ? ORDER BY rt.created_at ASC`,
      [kosId]
    );

    return NextResponse.json({ success: true, data: roomTypes });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: kosId } = await params;
    const body = await request.json();
    const parsed = roomTypeCreateSchema.safeParse(body);

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
        `INSERT INTO room_types (kos_id, name, description, price_monthly, stock_total, stock_available, 
         room_size, bathroom_type, electricity_type, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          kosId, data.name, data.description || null, data.priceMonthly,
          data.stockTotal, data.stockAvailable, data.roomSize || null,
          data.bathroomType, data.electricityType, data.isActive ? 1 : 0,
        ]
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
