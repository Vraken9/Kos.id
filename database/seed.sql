-- kos.id Seed Data
-- Run after schema.sql
-- NOTE: Admin is seeded via seed-admin.ts (bcrypt hash required)

USE kos_id;

-- ============================================
-- App Settings (singleton with campus data)
-- ============================================
INSERT INTO app_settings (
  id,
  campus_name,
  campus_address,
  campus_latitude,
  campus_longitude,
  campus_google_maps_url,
  payment_instructions
)
VALUES (
  1,
  'Universitas Ma''arif Nahdlatul Ulama',
  '8M4W+943 Jatisari, Kabupaten Kebumen, Jawa Tengah',
  -7.6941216,
  109.6952972,
  'https://maps.app.goo.gl/8s1QU9tmc8GeMypW6?g_st=ic',
  'Scan QRIS dan bayar sesuai nominal. Setelah itu upload bukti pembayaran.'
)
ON DUPLICATE KEY UPDATE
  campus_name = VALUES(campus_name),
  campus_address = VALUES(campus_address),
  campus_latitude = VALUES(campus_latitude),
  campus_longitude = VALUES(campus_longitude),
  campus_google_maps_url = VALUES(campus_google_maps_url);

-- ============================================
-- Facilities (8 default)
-- ============================================
INSERT INTO facilities (name, slug, scope, icon_key) VALUES
('WiFi', 'wifi', 'both', 'wifi'),
('AC', 'ac', 'room', 'snowflake'),
('Kamar Mandi Dalam', 'kamar-mandi-dalam', 'room', 'bath'),
('Dapur Bersama', 'dapur-bersama', 'kos', 'utensils'),
('Parkir Motor', 'parkir-motor', 'kos', 'bike'),
('Lemari', 'lemari', 'room', 'archive'),
('Kasur', 'kasur', 'room', 'bed-double'),
('Meja Belajar', 'meja-belajar', 'room', 'table')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- Demo Kos Data (2 aktif, 1 nonaktif)
-- NOTE: Coordinates are DEMO placeholders near kampus
-- ============================================
INSERT INTO kos (name, slug, description, address, latitude, longitude, google_maps_url, gender_type, owner_name, owner_whatsapp, rules, is_active, is_featured) VALUES
(
  'Kos Melati Demo',
  'kos-melati-demo',
  'Kos putri nyaman dekat kampus UMNU. Lokasi strategis, lingkungan aman dan tenang. [DATA DEMO]',
  'Jl. Jatisari No. 10, Kebumen, Jawa Tengah',
  -7.6935,
  109.6960,
  'https://maps.app.goo.gl/8s1QU9tmc8GeMypW6?g_st=ic',
  'putri',
  'Ibu Sari (Demo)',
  '6281234567890',
  'Tidak boleh membawa tamu laki-laki menginap.\nMaksimal tamu berkunjung sampai pukul 21.00 WIB.\nWajib menjaga kebersihan kamar dan area bersama.',
  1,
  1
),
(
  'Kos Mawar Demo',
  'kos-mawar-demo',
  'Kos putra murah meriah, dekat kampus dan warung makan. Cocok untuk mahasiswa hemat. [DATA DEMO]',
  'Jl. Kebumen Raya No. 25, Kebumen, Jawa Tengah',
  -7.6950,
  109.6940,
  'https://maps.app.goo.gl/8s1QU9tmc8GeMypW6?g_st=ic',
  'putra',
  'Pak Budi (Demo)',
  '6289876543210',
  'Tidak boleh membawa hewan peliharaan.\nListrik token sendiri.\nBuang sampah pada tempatnya.',
  1,
  0
),
(
  'Kos Dahlia Demo (Nonaktif)',
  'kos-dahlia-demo',
  'Kos campur sedang dalam renovasi. [DATA DEMO]',
  'Jl. Dahlia No. 5, Kebumen, Jawa Tengah',
  -7.6960,
  109.6950,
  NULL,
  'campur',
  'Pak Ahmad (Demo)',
  '6281122334455',
  NULL,
  0,
  0
);

-- ============================================
-- Kos Facilities (link kos to facilities)
-- ============================================
-- Kos Melati: WiFi, Dapur Bersama, Parkir Motor
INSERT INTO kos_facilities (kos_id, facility_id) VALUES
(1, 1), (1, 4), (1, 5);

-- Kos Mawar: WiFi, Parkir Motor
INSERT INTO kos_facilities (kos_id, facility_id) VALUES
(2, 1), (2, 5);

-- ============================================
-- Room Types
-- Kos Melati: 2 tipe kamar
-- ============================================
INSERT INTO room_types (kos_id, name, description, price_monthly, stock_total, stock_available, room_size, bathroom_type, electricity_type, is_active) VALUES
(1, 'Kamar Standar', 'Kamar nyaman dengan kasur dan lemari. [DEMO]', 750000, 5, 3, '3x3 m', 'shared', 'included', 1),
(1, 'Kamar AC + KM Dalam', 'Kamar luas dengan AC dan kamar mandi dalam. [DEMO]', 1200000, 3, 0, '3x4 m', 'inside', 'included', 1);

-- Kos Mawar: 2 tipe kamar
INSERT INTO room_types (kos_id, name, description, price_monthly, stock_total, stock_available, room_size, bathroom_type, electricity_type, is_active) VALUES
(2, 'Kamar Ekonomi', 'Kamar sederhana dan terjangkau. [DEMO]', 500000, 8, 5, '2.5x3 m', 'outside', 'token', 1),
(2, 'Kamar Standar AC', 'Kamar dengan AC, kamar mandi luar. [DEMO]', 800000, 4, 2, '3x3 m', 'outside', 'separate', 1);

-- ============================================
-- Room Type Facilities
-- ============================================
-- Kamar Standar Melati: Kasur, Lemari
INSERT INTO room_type_facilities (room_type_id, facility_id) VALUES
(1, 7), (1, 6);

-- Kamar AC Melati: WiFi, AC, KM Dalam, Kasur, Lemari, Meja Belajar
INSERT INTO room_type_facilities (room_type_id, facility_id) VALUES
(2, 1), (2, 2), (2, 3), (2, 7), (2, 6), (2, 8);

-- Kamar Ekonomi Mawar: Kasur
INSERT INTO room_type_facilities (room_type_id, facility_id) VALUES
(3, 7);

-- Kamar Standar AC Mawar: AC, Kasur, Lemari
INSERT INTO room_type_facilities (room_type_id, facility_id) VALUES
(4, 2), (4, 7), (4, 6);

-- ============================================
-- Kos Photos (Dummy Unsplash Images)
-- ============================================
INSERT INTO kos_photos (kos_id, image_path, is_cover, sort_order) VALUES
(1, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', 1, 0),
(1, 'https://images.unsplash.com/photo-1502672260266-1c1e5250ad99?w=800&q=80', 0, 1),
(2, 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80', 1, 0),
(2, 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80', 0, 1);
