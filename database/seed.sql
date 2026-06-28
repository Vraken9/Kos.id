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

-- ============================================
-- 10 Additional Realistic Demo Kos Data (IDs 4 to 13)
-- ============================================
INSERT INTO kos (id, name, slug, description, address, latitude, longitude, google_maps_url, gender_type, owner_name, owner_whatsapp, rules, is_active, is_featured) VALUES
(4, 'Kos Anggrek Putri', 'kos-anggrek-putri', 'Kos putri bersih dan tenang dengan fasilitas lengkap, sangat dekat dengan area kampus.', 'Jl. Anggrek No. 12, Kebumen, Jawa Tengah', -7.6930, 109.6950, 'https://maps.app.goo.gl/8s1QU9tmc8GeMypW6?g_st=ic', 'putri', 'Ibu Anggraeni', '6281234567804', 'Wajib menjaga kebersihan.\nTamu dilarang menginap.', 1, 1),
(5, 'Kos Garuda Putra', 'kos-garuda-putra', 'Kos khusus putra dengan parkiran motor luas dan akses 24 jam bebas jam malam.', 'Jl. Garuda No. 8, Kebumen, Jawa Tengah', -7.6945, 109.6965, 'https://maps.app.goo.gl/8s1QU9tmc8GeMypW6?g_st=ic', 'putra', 'Pak Santoso', '6281234567805', 'Akses kunci gerbang masing-masing.\nDilarang berisik di atas jam 11 malam.', 1, 0),
(6, 'Kos Sejahtera Campur', 'kos-sejahtera-campur', 'Kos campur eksklusif untuk mahasiswa maupun pekerja kantoran dengan keamanan CCTV.', 'Jl. Sejahtera No. 45, Kebumen, Jawa Tengah', -7.6955, 109.6945, 'https://maps.app.goo.gl/8s1QU9tmc8GeMypW6?g_st=ic', 'campur', 'Pak Hendra', '6281234567806', 'Wajib melampirkan KTP saat check-in.', 1, 1),
(7, 'Kos Bintang Putri Exclusive', 'kos-bintang-putri-exclusive', 'Kos putri modern bernuansa estetis dengan fasilitas kamar mandi dalam dan AC pendingin.', 'Jl. Bintang No. 3, Kebumen, Jawa Tengah', -7.6925, 109.6970, 'https://maps.app.goo.gl/8s1QU9tmc8GeMypW6?g_st=ic', 'putri', 'Ibu Bintang', '6281234567807', 'Khusus putri mahasiswi/karyawati baik-baik.', 1, 1),
(8, 'Kos Harmoni Putra', 'kos-harmoni-putra', 'Kos putra ekonomis lingkungan nyaman, free WiFi cepat untuk ngerjain tugas kuliah.', 'Jl. Harmoni No. 19, Kebumen, Jawa Tengah', -7.6965, 109.6935, 'https://maps.app.goo.gl/8s1QU9tmc8GeMypW6?g_st=ic', 'putra', 'Pak Harmoko', '6281234567808', 'Parkir motor rapi.\nBuang sampah pada tempatnya.', 1, 0),
(9, 'Kos Pelangi Putri', 'kos-pelangi-putri', 'Lingkungan asri penuh tanaman hijau, sirkulasi udara sangat segar dan tenang.', 'Jl. Pelangi No. 7, Kebumen, Jawa Tengah', -7.6938, 109.6942, 'https://maps.app.goo.gl/8s1QU9tmc8GeMypW6?g_st=ic', 'putri', 'Ibu Ratna', '6281234567809', 'Gerbang dikunci pukul 22.00 WIB.', 1, 0),
(10, 'Kos Nusantara Putra', 'kos-nusantara-putra', 'Kos bangunan baru dengan desain minimalis, setiap kamar memiliki jendela menghadap luar.', 'Jl. Nusantara No. 22, Kebumen, Jawa Tengah', -7.6948, 109.6958, 'https://maps.app.goo.gl/8s1QU9tmc8GeMypW6?g_st=ic', 'putra', 'Pak Gunawan', '6281234567810', 'Dilarang merokok di dalam kamar.', 1, 0),
(11, 'Kos Asri Campur', 'kos-asri-campur', 'Kos campur dengan area dapur bersama yang luas dan bersih, dekat minimarket.', 'Jl. Asri Raya No. 14, Kebumen, Jawa Tengah', -7.6952, 109.6968, 'https://maps.app.goo.gl/8s1QU9tmc8GeMypW6?g_st=ic', 'campur', 'Ibu Maya', '6281234567811', 'Menjaga ketertiban bersama.', 1, 0),
(12, 'Kos Kenanga Putri', 'kos-kenanga-putri', 'Tempat kos putri budget bersahabat, sudah termasuk listrik dan air bersih.', 'Jl. Kenanga No. 31, Kebumen, Jawa Tengah', -7.6928, 109.6938, 'https://maps.app.goo.gl/8s1QU9tmc8GeMypW6?g_st=ic', 'putri', 'Ibu Kenanga', '6281234567812', 'Tamu tunggu di teras luar.', 1, 0),
(13, 'Kos Merpati Putra', 'kos-merpati-putra', 'Kos putra strategis pinggir jalan utama, mudah cari makan dan transportasi umum.', 'Jl. Merpati No. 9, Kebumen, Jawa Tengah', -7.6958, 109.6952, 'https://maps.app.goo.gl/8s1QU9tmc8GeMypW6?g_st=ic', 'putra', 'Pak Bowo', '6281234567813', 'Akses kunci 24 jam.', 1, 0)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO kos_facilities (kos_id, facility_id) VALUES
(4, 1), (4, 4), (4, 5),
(5, 1), (5, 5),
(6, 1), (6, 2), (6, 4), (6, 5),
(7, 1), (7, 2), (7, 3), (7, 5),
(8, 1), (8, 5),
(9, 1), (9, 4),
(10, 1), (10, 5),
(11, 1), (11, 4), (11, 5),
(12, 1), (12, 5),
(13, 1), (13, 5)
ON DUPLICATE KEY UPDATE kos_id = VALUES(kos_id);

INSERT INTO room_types (id, kos_id, name, description, price_monthly, stock_total, stock_available, room_size, bathroom_type, electricity_type, is_active) VALUES
(5, 4, 'Kamar Nyaman', 'Kamar bersih dengan sirkulasi udara baik.', 650000, 6, 4, '3x3 m', 'shared', 'included', 1),
(6, 5, 'Kamar Putra Luas', 'Kamar cocok untuk mahasiswa.', 600000, 8, 3, '3x3.5 m', 'shared', 'included', 1),
(7, 6, 'Kamar Exclusive AC', 'Kamar ber-AC dengan keamanan CCTV.', 1100000, 5, 2, '3x4 m', 'inside', 'token', 1),
(8, 7, 'VIP Room Putri', 'Kamar full furnished mewah.', 1350000, 4, 1, '3.5x4 m', 'inside', 'included', 1),
(9, 8, 'Kamar Hemat', 'Solusi hemat untuk mahasiswa.', 450000, 10, 6, '2.5x3 m', 'outside', 'included', 1),
(10, 9, 'Kamar Asri', 'Jendela menghadap taman.', 700000, 5, 3, '3x3 m', 'shared', 'included', 1),
(11, 10, 'Kamar Minimalis', 'Desain modern bersih.', 800000, 6, 4, '3x3 m', 'shared', 'token', 1),
(12, 11, 'Kamar Campur Standar', 'Akses mudah dekat dapur.', 750000, 7, 5, '3x3 m', 'shared', 'included', 1),
(13, 12, 'Kamar Bersahabat', 'Sudah termasuk listrik & air.', 550000, 6, 2, '3x3 m', 'shared', 'included', 1),
(14, 13, 'Kamar Strategis', 'Akses mudah kemana saja.', 650000, 8, 5, '3x3 m', 'shared', 'included', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO kos_photos (kos_id, image_path, is_cover, sort_order) VALUES
(4, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80', 1, 0),
(5, 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80', 1, 0),
(6, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', 1, 0),
(7, 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80', 1, 0),
(8, 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800&q=80', 1, 0),
(9, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80', 1, 0),
(10, 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80', 1, 0),
(11, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 1, 0),
(12, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', 1, 0),
(13, 'https://images.unsplash.com/photo-1502672260266-1c1e5250ad99?w=800&q=80', 1, 0);
