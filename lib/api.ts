import { getMyBlockedDates } from '@/backend/src/controllers/blockedDatesController';
import { getMyServices } from '@/backend/src/controllers/serviceController';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});


export const authAPI = {
    register: (data: {
        email: string;
        password: string;
        name: string;
        role: 'user' | 'provider';
        provider_type?: string;
    }) => api.post('/api/auth/register', data),

    login: (data: {
        email: string;
        password: string;
    }) => api.post('/api/auth/login', data),

    logout: () => api.post('/api/auth/logout'),

    me: () => api.get('/api/auth/me'),
};

export const publicAPI = {
    getProviders: (provider_type?: string) => api.get('/api/providers', { params: { provider_type } }),
    getProviderServices: (provider_id: number) => api.get(`/api/providers/${provider_id}/services`),
    getAvailableSlots: (provider_id: number, date: string) => api.get(`/api/providers/${provider_id}/slots`, { params: { provider_id,date } }),
};

export const userAPI = {
    getMyBookings: () => api.get('/api/user/bookings'),
    createBooking: (data:{
        provider_id: number;
        service_id:number,
        appointment_date: string;
        appointment_time: string;
        notes?: string;
    }) => api.post('/api/user/bookings', data),
    cancelBooking: (id: number) => api.put(`/api/user/bookings/${id}/cancel`)
};

export const providerAPI = {
    getMyServices: () => api.get('/api/provider/services'),
    createService: (data: {
        name: string;
        description: string;
        price: number;
    }) => api.post('/api/provider/services', data),
    updateService: (id: number, data: {
        name: string;
        description: string;
        price: number;
    }) => api.put(`/api/provider/services/${id}`, data),
    deleteService: (id: number) => api.delete(`/api/provider/services/${id}`),
    getMyAvailability: () => api.get('/api/provider/availability'),
    addAvailability: (data: {
        day_of_week: number;
        start_time: string;
        end_time: string;
    }) => api.post('/api/provider/availability', data),
    getBlockedDates: () => api.get('/api/provider/blocked-dates'),
    blockDate: (data: {
        blocked_date: string;
        reason?: string;
    }) => api.post('/api/provider/blocked-dates', data),
    getMyBookings: () => api.get('/api/provider/bookings'),
    updateBookingStatus: (id: number, status: string) => api.put(`/api/provider/bookings/${id}/status`, { status }),
};

