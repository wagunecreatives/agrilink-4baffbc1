export type UserRole = 'farmer' | 'customer' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
}

export interface Crop {
  id: string;
  farmer_id: string;
  name: string;
  variety: string | null;
  planting_date: string | null;
  expected_harvest: string | null;
  quantity: number | null;
  unit: string | null;
  status: 'growing' | 'ready' | 'harvested' | 'sold';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Disease {
  id: string;
  name: string;
  description: string;
  symptoms: string[];
  treatment: string;
  prevention: string;
  affected_crops: string[];
  image_url: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

export interface DiagnosisRequest {
  id: string;
  farmer_id: string;
  crop_id: string | null;
  image_url: string;
  description: string | null;
  ai_diagnosis: string | null;
  confirmed_disease_id: string | null;
  status: 'pending' | 'diagnosed' | 'confirmed' | 'resolved';
  created_at: string;
  updated_at: string;
}

export interface MarketListing {
  id: string;
  farmer_id: string;
  crop_id: string | null;
  title: string;
  description: string | null;
  crop_type: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  currency: string;
  location: string;
  images: string[];
  is_available: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  listing_id: string;
  customer_id: string;
  farmer_id: string;
  quantity: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  delivery_address: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface WeatherData {
  id: string;
  location: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  wind_speed: number;
  forecast: object;
  recorded_at: string;
}

export interface FarmingTip {
  id: string;
  title: string;
  content: string;
  category: string;
  crop_types: string[];
  season: string | null;
  author_id: string | null;
  is_featured: boolean;
  created_at: string;
}
