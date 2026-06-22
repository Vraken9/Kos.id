import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import path from 'path';

// Load .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

const dbUrl = process.env.DATABASE_URL;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const KOS_NAMES = ['Sejahtera', 'Nyaman', 'Mawar', 'Melati', 'Anggrek', 'Amanah', 'Bintang', 'Sinar', 'Harapan', 'Purnama', 'Exclusive', 'Premium', 'Minimalis', 'Asri', 'Indah'];
const ADJECTIVES = ['Residences', 'Kost', 'Guest House', 'Boarding', 'Living', 'House'];
const ADDRESSES = ['Jl. Merdeka No. ', 'Jl. Sudirman No. ', 'Jl. Pahlawan No. ', 'Jl. Diponegoro No. ', 'Jl. Gajah Mada No. ', 'Jl. Ahmad Yani No. ', 'Jl. Veteran No. ', 'Jl. Pemuda No. '];

const ROOM_NAMES = ['Kamar Standar', 'Kamar Superior', 'Kamar Deluxe', 'Kamar VIP', 'Kamar AC Plus', 'Kamar Ekonomis'];
const ROOM_DESC = ['Kamar nyaman dengan pencahayaan baik.', 'Kamar luas cocok untuk mahasiswa atau pekerja.', 'Kamar premium dengan fasilitas lengkap.', 'Kamar hemat dengan ventilasi udara yang baik.'];

const GENDERS = ['putra', 'putri', 'campur'];
const BATHROOMS = ['inside', 'outside', 'shared'];
const ELECTRICITY = ['included', 'token', 'separate'];

const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1e5250ad99?w=800&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80',
  'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'
];

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kos_id',
  });

  try {
    console.log('Clearing old kos data...');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    await pool.execute('TRUNCATE TABLE room_type_facilities');
    await pool.execute('TRUNCATE TABLE kos_facilities');
    await pool.execute('TRUNCATE TABLE kos_photos');
    await pool.execute('TRUNCATE TABLE bookings');
    await pool.execute('TRUNCATE TABLE payment_proofs');
    await pool.execute('TRUNCATE TABLE booking_status_logs');
    await pool.execute('TRUNCATE TABLE room_types');
    await pool.execute('TRUNCATE TABLE kos');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Generating 30 dummy kos in Kebumen...');
    for (let i = 1; i <= 30; i++) {
      const kosName = `${randomItem(KOS_NAMES)} ${randomItem(ADJECTIVES)} ${i}`;
      const slug = kosName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + randomInt(100, 999);
      const address = randomItem(ADDRESSES) + randomInt(1, 200) + ', Kabupaten Kebumen';
      const lat = -7.6941216 + ((Math.random() - 0.5) * 0.05); // Around Kebumen
      const lng = 109.6952972 + ((Math.random() - 0.5) * 0.05);
      
      const mapsUrl = `https://www.google.com/maps/place/${lat},${lng}`;
      
      const [kosResult] = await pool.execute(
        `INSERT INTO kos (name, slug, description, address, latitude, longitude, google_maps_url, gender_type, owner_name, owner_whatsapp, is_active, is_featured) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          kosName, slug, `Kos ${kosName} yang asri, nyaman, dan strategis dekat dengan kampus. Bebas jam malam namun tetap aman.`,
          address, lat, lng, mapsUrl, randomItem(GENDERS), 'Bapak/Ibu Pemilik', '089530123608', 1, Math.random() > 0.8 ? 1 : 0
        ]
      );
      
      const kosId = (kosResult as any).insertId;

      // Add 2 to 4 photos
      const numPhotos = randomInt(2, 4);
      for (let p = 0; p < numPhotos; p++) {
        await pool.execute(
          `INSERT INTO kos_photos (kos_id, image_path, is_cover, sort_order) VALUES (?, ?, ?, ?)`,
          [kosId, randomItem(UNSPLASH_IMAGES), p === 0 ? 1 : 0, p]
        );
      }

      // Add 2 to 3 room types
      const numRooms = randomInt(1, 3);
      for (let r = 0; r < numRooms; r++) {
        const roomName = randomItem(ROOM_NAMES) + (r > 0 ? ` Tipe ${String.fromCharCode(65+r)}` : '');
        const price = randomInt(4, 15) * 100000;
        const totalStock = randomInt(3, 10);
        const availStock = randomInt(0, totalStock);
        
        await pool.execute(
          `INSERT INTO room_types (kos_id, name, description, price_monthly, stock_total, stock_available, room_size, bathroom_type, electricity_type, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            kosId, roomName, randomItem(ROOM_DESC), price, totalStock, availStock,
            `${randomInt(2,4)}x${randomInt(3,5)}`, randomItem(BATHROOMS), randomItem(ELECTRICITY), 1
          ]
        );
      }

      // Add general kos facilities
      // public facilities (id 4 to 8 roughly)
      const kosFacs = new Set([randomInt(4, 6), randomInt(6, 8)]);
      for (const fId of kosFacs) {
        await pool.execute('INSERT IGNORE INTO kos_facilities (kos_id, facility_id) VALUES (?, ?)', [kosId, fId]);
      }
    }

    console.log('Dummy data generation completed successfully!');
  } catch (error) {
    console.error('Error generating data:', error);
  } finally {
    await pool.end();
  }
}

seed();
