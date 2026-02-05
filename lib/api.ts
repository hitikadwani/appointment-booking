import axios from 'axios';

// Use relative URLs since the API is now part of the Next.js app
export const api = axios.create({
    baseURL: '/api',
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
    }) => api.post('/auth/register', data),

    login: (data: {
        email: string;
        password: string;
    }) => api.post('/auth/login', data),

    logout: () => api.post('/auth/logout'),

    me: () => api.get('/auth/me'),
};

export const publicAPI = {
    getProviders: (provider_type?: string) => api.get('/providers', { params: { provider_type } }),
    getProviderServices: (provider_id: number) => api.get(`/providers/${provider_id}/services`),
    getAvailableSlots: (provider_id: number, date: string) => api.get(`/providers/${provider_id}/slots`, { params: { date } }),
};

export const userAPI = {
    getMyBookings: () => api.get('/user/bookings'),
    createBooking: (data:{
        provider_id: number;
        service_id:number,
        appointment_date: string;
        appointment_time: string;
        notes?: string;
    }) => api.post('/user/bookings', data),
    cancelBooking: (id: number) => api.put(`/user/bookings/${id}/cancel`)
};

export const providerAPI = {
    getMyServices: () => api.get('/provider/services'),
    createService: (data: {
        name: string;
        description: string;
        price: number;
    }) => api.post('/provider/services', data),
    updateService: (id: number, data: {
        name: string;
        description: string;
        price: number;
    }) => api.put(`/provider/services/${id}`, data),
    deleteService: (id: number) => api.delete(`/provider/services/${id}`),
    getMyAvailability: () => api.get('/provider/availability'),
    addAvailability: (data: {
        day_of_week: number;
        start_time: string;
        end_time: string;
    }) => api.post('/provider/availability', data),
    getBlockedDates: () => api.get('/provider/blocked-dates'),
    blockDate: (data: {
        blocked_date: string;
        reason?: string;
    }) => api.post('/provider/blocked-dates', data),
    getMyBookings: () => api.get('/provider/bookings'),
    updateBookingStatus: (id: number, status: string) => api.put(`/provider/bookings/${id}/status`, { status }),
};

