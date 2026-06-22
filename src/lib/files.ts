import path from 'path';
import fs from 'fs/promises';
import { randomBytes } from 'crypto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export interface UploadResult {
  relativePath: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
}

/**
 * Validate and save an uploaded file
 */
export async function saveUploadedFile(
  file: File,
  category: 'kos' | 'qris' | 'payment-proofs',
  maxSizeBytes: number = 3 * 1024 * 1024 // 3 MB default
): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new UploadError(
      'File tidak valid. Gunakan gambar JPG, PNG, atau WebP.',
      'UPLOAD_ERROR'
    );
  }

  // Validate file size
  if (file.size > maxSizeBytes) {
    const maxMB = Math.round(maxSizeBytes / (1024 * 1024));
    throw new UploadError(
      `Ukuran file terlalu besar. Maksimal ${maxMB} MB.`,
      'UPLOAD_ERROR'
    );
  }

  // Validate extension
  const originalName = file.name || 'upload';
  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new UploadError(
      'Ekstensi file tidak didukung. Gunakan .jpg, .png, atau .webp.',
      'UPLOAD_ERROR'
    );
  }

  // Generate safe filename
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const random = randomBytes(4).toString('hex');
  const safeExt = ext || '.jpg';
  const filename = `${category}-${timestamp}-${random}${safeExt}`;

  // Ensure upload directory exists
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', category);
  await fs.mkdir(uploadDir, { recursive: true });

  // Save file
  const filePath = path.join(uploadDir, filename);
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));

  return {
    relativePath: `/uploads/${category}/${filename}`,
    originalFilename: originalName,
    mimeType: file.type,
    fileSize: file.size,
  };
}

/**
 * Delete an uploaded file
 */
export async function deleteUploadedFile(relativePath: string): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), 'public', relativePath);
    await fs.unlink(fullPath);
  } catch {
    // File might not exist, ignore
  }
}

export class UploadError extends Error {
  code: string;
  constructor(message: string, code: string = 'UPLOAD_ERROR') {
    super(message);
    this.code = code;
    this.name = 'UploadError';
  }
}
