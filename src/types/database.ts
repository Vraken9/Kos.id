// Database type definitions for kos.id

export type GenderType = 'putra' | 'putri' | 'campur';
export type FacilityScope = 'kos' | 'room' | 'both';
export type BathroomType = 'inside' | 'outside' | 'shared';
export type ElectricityType = 'included' | 'token' | 'separate';
export type BookingStatus =
  | 'waiting_payment'
  | 'waiting_confirmation'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export interface Admin {
  id: number;
  username: string;
  password_hash: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface AppSettings {
  id: number;
  campus_name: string;
  campus_address: string | null;
  campus_latitude: number | null;
  campus_longitude: number | null;
  campus_google_maps_url: string | null;
  qris_image_path: string | null;
  payment_receiver_name: string | null;
  payment_instructions: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Facility {
  id: number;
  name: string;
  slug: string;
  scope: FacilityScope;
  icon_key: string | null;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export interface Kos {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  gender_type: GenderType;
  owner_name: string | null;
  owner_whatsapp: string;
  rules: string | null;
  is_active: number;
  is_featured: number;
  created_at: Date;
  updated_at: Date;
}

export interface KosFacility {
  kos_id: number;
  facility_id: number;
}

export interface RoomType {
  id: number;
  kos_id: number;
  name: string;
  description: string | null;
  price_monthly: number;
  stock_total: number;
  stock_available: number;
  room_size: string | null;
  bathroom_type: BathroomType;
  electricity_type: ElectricityType;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export interface RoomTypeFacility {
  room_type_id: number;
  facility_id: number;
}

export interface KosPhoto {
  id: number;
  kos_id: number;
  room_type_id: number | null;
  image_path: string;
  alt_text: string | null;
  is_cover: number;
  sort_order: number;
  created_at: Date;
}

export interface Booking {
  id: number;
  booking_code: string;
  access_token: string;
  kos_id: number;
  room_type_id: number;
  customer_name: string;
  customer_whatsapp: string;
  planned_checkin_date: string;
  customer_note: string | null;
  status: BookingStatus;
  payment_amount: number;
  snapshot_kos_name: string;
  snapshot_kos_address: string;
  snapshot_room_type_name: string;
  snapshot_owner_whatsapp: string;
  admin_note: string | null;
  confirmed_by_admin_id: number | null;
  confirmed_at: Date | null;
  cancelled_at: Date | null;
  expired_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentProof {
  id: number;
  booking_id: number;
  image_path: string;
  original_filename: string | null;
  mime_type: string;
  file_size: number;
  is_active: number;
  uploaded_at: Date;
}

export interface BookingStatusLog {
  id: number;
  booking_id: number;
  old_status: string | null;
  new_status: string;
  note: string | null;
  changed_by_admin_id: number | null;
  created_at: Date;
}

// API Response types
export interface KosListItem {
  id: number;
  name: string;
  slug: string;
  address: string;
  coverImageUrl: string | null;
  genderType: GenderType;
  distanceKm: number | null;
  minimumPrice: number | null;
  availableStock: number;
  isAvailable: boolean;
  facilities: { name: string; slug: string; iconKey: string | null }[];
}

export interface KosDetail extends Kos {
  distanceKm: number | null;
  coverImageUrl: string | null;
  photos: KosPhoto[];
  facilities: Facility[];
  roomTypes: (RoomType & {
    facilities: Facility[];
    photos: KosPhoto[];
  })[];
  campus: {
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    googleMapsUrl: string | null;
  };
}
