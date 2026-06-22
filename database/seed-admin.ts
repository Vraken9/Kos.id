/**
 * Admin Seed Script
 * Run: npx tsx database/seed-admin.ts
 * 
 * Hashes admin password with bcrypt and inserts into database.
 * Reads ADMIN_USERNAME and ADMIN_PASSWORD from .env.local
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import path from 'path';

// Load .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  if (!password || password.length < 6) {
    console.error('ADMIN_PASSWORD must be at least 6 characters');
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kos_id',
  });

  try {
    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    console.log(`Seeding admin: ${username}`);
    await connection.execute(
      `INSERT INTO admins (username, password_hash, name) 
       VALUES (?, ?, 'Super Admin')
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      [username, passwordHash]
    );

    console.log('✅ Admin seeded successfully!');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedAdmin();
