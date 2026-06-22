import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kos_id',
  });

  try {
    await conn.execute('ALTER TABLE bookings ADD COLUMN duration_months INT DEFAULT 1 AFTER status');
    console.log('Added duration_months successfully.');
  } catch (err: any) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column duration_months already exists.');
    } else {
      console.error(err);
    }
  } finally {
    await conn.end();
  }
}
run();
