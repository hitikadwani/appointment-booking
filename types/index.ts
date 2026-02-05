export interface User {
    id: number;
    email: string;
    name: string;
    role: 'user' | 'provider';
    provider_type?: 'doctor' | 'salon' | 'car-rental';
  }
  
  export interface Service {
    id: number;
    provider_id: number;
    name: string;
    description: string;
    price: number;
    created_at: string;
    updated_at: string;
  }
  
  export interface Provider {
    id: number;
    provider_type: string;
    name: string;
    email: string;
    bio: string | null;
  }
  
  export interface AvailabilitySlot {
    id: number;
    provider_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }
  
  export interface Appointment {
    id: number;
    user_id: number;
    provider_id: number;
    service_id: number;
    appointment_date: string;
    appointment_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    notes: string | null;
    provider_name?: string;
    provider_type?: string;
    service_name?: string;
    user_name?: string;
    user_email?: string;
    price?: number;
}