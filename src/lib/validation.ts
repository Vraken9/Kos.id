import { z } from 'zod';

// ============================================
// Public Schemas
// ============================================

export const bookingCreateSchema = z.object({
  kosId: z.number().int().positive(),
  roomTypeId: z.number().int().positive(),
  customerName: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  customerWhatsapp: z.string().trim().min(8, 'Nomor WhatsApp tidak valid').max(20),
  plannedCheckinDate: z.string().refine((val) => {
    const date = new Date(val);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, 'Tanggal mulai sewa tidak valid atau sudah lewat'),
  customerNote: z.string().trim().max(500).optional().default(''),
});

// ============================================
// Admin Auth Schemas
// ============================================

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

// ============================================
// Admin Kos Schemas
// ============================================

export const kosCreateSchema = z.object({
  name: z.string().trim().min(1, 'Nama kos wajib diisi').max(150),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan dash'),
  description: z.string().trim().max(5000).optional().default(''),
  address: z.string().trim().min(1, 'Alamat wajib diisi'),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  googleMapsUrl: z.string().url().max(500).optional().or(z.literal('')).default(''),
  genderType: z.enum(['putra', 'putri', 'campur']),
  ownerName: z.string().trim().max(120).optional().default(''),
  ownerWhatsapp: z.string().trim().min(8, 'WhatsApp pemilik wajib diisi').max(20),
  rules: z.string().trim().max(5000).optional().default(''),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  facilityIds: z.array(z.number().int().positive()).optional().default([]),
});

export const kosUpdateSchema = kosCreateSchema.partial();

// ============================================
// Admin Room Type Schemas
// ============================================

export const roomTypeCreateSchema = z.object({
  name: z.string().trim().min(1, 'Nama tipe kamar wajib').max(120),
  description: z.string().trim().max(2000).optional().default(''),
  priceMonthly: z.number().int().positive('Harga harus lebih dari 0'),
  stockTotal: z.number().int().min(0),
  stockAvailable: z.number().int().min(0),
  roomSize: z.string().trim().max(50).optional().default(''),
  bathroomType: z.enum(['inside', 'outside', 'shared']),
  electricityType: z.enum(['included', 'token', 'separate']),
  isActive: z.boolean().default(true),
  facilityIds: z.array(z.number().int().positive()).optional().default([]),
}).refine((data) => data.stockAvailable <= data.stockTotal, {
  message: 'Stok tersedia tidak boleh lebih besar dari stok total',
  path: ['stockAvailable'],
});

export const roomTypeUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  priceMonthly: z.number().int().positive().optional(),
  stockTotal: z.number().int().min(0).optional(),
  stockAvailable: z.number().int().min(0).optional(),
  roomSize: z.string().trim().max(50).optional(),
  bathroomType: z.enum(['inside', 'outside', 'shared']).optional(),
  electricityType: z.enum(['included', 'token', 'separate']).optional(),
  isActive: z.boolean().optional(),
  facilityIds: z.array(z.number().int().positive()).optional(),
});

// ============================================
// Admin Facility Schemas
// ============================================

export const facilityCreateSchema = z.object({
  name: z.string().trim().min(1, 'Nama fasilitas wajib').max(100),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/),
  scope: z.enum(['kos', 'room', 'both']),
  iconKey: z.string().trim().max(50).optional().default(''),
});

export const facilityUpdateSchema = facilityCreateSchema.partial();

// ============================================
// Admin Settings Schemas
// ============================================

export const campusSettingsSchema = z.object({
  name: z.string().trim().min(1).max(150),
  address: z.string().trim().max(500).optional().default(''),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  googleMapsUrl: z.string().max(500).optional().default(''),
});

export const paymentSettingsSchema = z.object({
  receiverName: z.string().trim().max(150).optional().default(''),
  paymentInstructions: z.string().trim().max(1000).optional().default(''),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
});

// ============================================
// Admin Booking Action Schemas
// ============================================

export const bookingConfirmSchema = z.object({
  adminNote: z.string().trim().max(500).optional().default(''),
});

export const bookingRejectSchema = z.object({
  adminNote: z.string().trim().min(1, 'Catatan admin wajib diisi saat reject').max(500),
});

export const bookingCancelSchema = z.object({
  adminNote: z.string().trim().min(1, 'Catatan admin wajib diisi saat cancel').max(500),
});
