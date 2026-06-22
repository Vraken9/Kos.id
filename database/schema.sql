-- kos.id Database Schema
-- Target: MySQL XAMPP
-- Character set: utf8mb4

CREATE DATABASE IF NOT EXISTS kos_id
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kos_id;

-- ============================================
-- Table: admins
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL DEFAULT 'Super Admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- Table: app_settings (singleton, id always = 1)
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
  id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  campus_name VARCHAR(150) NOT NULL DEFAULT 'Universitas Ma''arif Nahdlatul Ulama',
  campus_address TEXT NULL,
  campus_latitude DECIMAL(10, 8) NULL,
  campus_longitude DECIMAL(11, 8) NULL,
  campus_google_maps_url TEXT NULL,
  qris_image_path VARCHAR(255) NULL,
  payment_receiver_name VARCHAR(150) NULL,
  payment_instructions TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT app_settings_singleton CHECK (id = 1)
);

-- ============================================
-- Table: facilities
-- ============================================
CREATE TABLE IF NOT EXISTS facilities (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  scope ENUM('kos', 'room', 'both') NOT NULL DEFAULT 'both',
  icon_key VARCHAR(50) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- Table: kos
-- ============================================
CREATE TABLE IF NOT EXISTS kos (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  description TEXT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  google_maps_url TEXT NULL,
  gender_type ENUM('putra', 'putri', 'campur') NOT NULL,
  owner_name VARCHAR(120) NULL,
  owner_whatsapp VARCHAR(30) NOT NULL,
  rules TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_kos_active (is_active),
  INDEX idx_kos_gender (gender_type),
  INDEX idx_kos_featured (is_featured),
  INDEX idx_kos_location (latitude, longitude)
);

-- ============================================
-- Table: kos_facilities (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS kos_facilities (
  kos_id BIGINT UNSIGNED NOT NULL,
  facility_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (kos_id, facility_id),
  CONSTRAINT fk_kos_facilities_kos
    FOREIGN KEY (kos_id) REFERENCES kos(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_kos_facilities_facility
    FOREIGN KEY (facility_id) REFERENCES facilities(id)
    ON DELETE RESTRICT
);

-- ============================================
-- Table: room_types
-- ============================================
CREATE TABLE IF NOT EXISTS room_types (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  kos_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  price_monthly INT UNSIGNED NOT NULL,
  stock_total INT UNSIGNED NOT NULL DEFAULT 0,
  stock_available INT UNSIGNED NOT NULL DEFAULT 0,
  room_size VARCHAR(50) NULL,
  bathroom_type ENUM('inside', 'outside', 'shared') NOT NULL DEFAULT 'shared',
  electricity_type ENUM('included', 'token', 'separate') NOT NULL DEFAULT 'included',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_room_types_kos
    FOREIGN KEY (kos_id) REFERENCES kos(id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_room_stock_available
    CHECK (stock_available <= stock_total),
  INDEX idx_room_kos_active (kos_id, is_active),
  INDEX idx_room_price (price_monthly),
  INDEX idx_room_stock (stock_available)
);

-- ============================================
-- Table: room_type_facilities (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS room_type_facilities (
  room_type_id BIGINT UNSIGNED NOT NULL,
  facility_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (room_type_id, facility_id),
  CONSTRAINT fk_room_facilities_room
    FOREIGN KEY (room_type_id) REFERENCES room_types(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_room_facilities_facility
    FOREIGN KEY (facility_id) REFERENCES facilities(id)
    ON DELETE RESTRICT
);

-- ============================================
-- Table: kos_photos
-- ============================================
CREATE TABLE IF NOT EXISTS kos_photos (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  kos_id BIGINT UNSIGNED NOT NULL,
  room_type_id BIGINT UNSIGNED NULL,
  image_path VARCHAR(255) NOT NULL,
  alt_text VARCHAR(160) NULL,
  is_cover TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_kos_photos_kos
    FOREIGN KEY (kos_id) REFERENCES kos(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_kos_photos_room
    FOREIGN KEY (room_type_id) REFERENCES room_types(id)
    ON DELETE SET NULL,
  INDEX idx_photos_kos_cover (kos_id, is_cover),
  INDEX idx_photos_room (room_type_id)
);

-- ============================================
-- Table: bookings
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  booking_code VARCHAR(40) NOT NULL UNIQUE,
  access_token VARCHAR(128) NOT NULL UNIQUE,
  kos_id BIGINT UNSIGNED NOT NULL,
  room_type_id BIGINT UNSIGNED NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_whatsapp VARCHAR(30) NOT NULL,
  planned_checkin_date DATE NOT NULL,
  customer_note TEXT NULL,
  status ENUM(
    'waiting_payment',
    'waiting_confirmation',
    'confirmed',
    'rejected',
    'cancelled',
    'expired'
  ) NOT NULL DEFAULT 'waiting_payment',
  duration_months INT UNSIGNED NOT NULL DEFAULT 1,
  payment_amount INT UNSIGNED NOT NULL,
  snapshot_kos_name VARCHAR(150) NOT NULL,
  snapshot_kos_address TEXT NOT NULL,
  snapshot_room_type_name VARCHAR(120) NOT NULL,
  snapshot_owner_whatsapp VARCHAR(30) NOT NULL,
  admin_note TEXT NULL,
  confirmed_by_admin_id BIGINT UNSIGNED NULL,
  confirmed_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  expired_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_kos
    FOREIGN KEY (kos_id) REFERENCES kos(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_room
    FOREIGN KEY (room_type_id) REFERENCES room_types(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_confirmed_admin
    FOREIGN KEY (confirmed_by_admin_id) REFERENCES admins(id)
    ON DELETE SET NULL,
  INDEX idx_bookings_status (status),
  INDEX idx_bookings_created_at (created_at),
  INDEX idx_bookings_customer_whatsapp (customer_whatsapp),
  INDEX idx_bookings_kos_room (kos_id, room_type_id)
);

-- ============================================
-- Table: payment_proofs
-- ============================================
CREATE TABLE IF NOT EXISTS payment_proofs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  original_filename VARCHAR(180) NULL,
  mime_type VARCHAR(80) NOT NULL,
  file_size INT UNSIGNED NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_proofs_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE,
  INDEX idx_payment_proofs_booking_active (booking_id, is_active)
);

-- ============================================
-- Table: booking_status_logs
-- ============================================
CREATE TABLE IF NOT EXISTS booking_status_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  old_status VARCHAR(40) NULL,
  new_status VARCHAR(40) NOT NULL,
  note TEXT NULL,
  changed_by_admin_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_logs_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_booking_logs_admin
    FOREIGN KEY (changed_by_admin_id) REFERENCES admins(id)
    ON DELETE SET NULL,
  INDEX idx_booking_logs_booking (booking_id),
  INDEX idx_booking_logs_created_at (created_at)
);
