import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initDb } from './db/init';
import { auth, requireRole } from './middleware/auth';
import * as authController from './controllers/authController';
import * as serviceController from './controllers/serviceController';
import * as availabilityController from './controllers/availabilityController';
import * as blockedDatesController from './controllers/blockedDatesController';
import * as bookingController from './controllers/bookingController';
import * as publicController from './controllers/publicController';

dotenv.config();
const app = express();

// IMPORTANT: Configure CORS to allow credentials (cookies)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Your Next.js URL
  credentials: true // Allow cookies
}));

app.use(express.json());
app.use(cookieParser());

initDb().catch(console.error);

app.get('/health', (_, res) => res.json({ ok: true }));

// Public routes
app.get('/api/providers', publicController.getProviders);
app.get('/api/providers/:provider_id/services', publicController.getProviderServices);
app.get('/api/providers/:provider_id/slots', publicController.getAvailableSlots);

// Auth routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/logout', authController.logout);
app.get('/api/auth/me', auth, authController.me);

// User routes
app.get('/api/user/bookings', auth, requireRole(['user']), bookingController.getMyBookings);
app.post('/api/user/bookings', auth, requireRole(['user']), bookingController.createBooking);
app.put('/api/user/bookings/:id/cancel', auth, requireRole(['user']), bookingController.cancelBooking);

// Provider routes
app.get('/api/provider/services', auth, requireRole(['provider']), serviceController.getMyServices);
app.post('/api/provider/services', auth, requireRole(['provider']), serviceController.createService);
app.put('/api/provider/services/:id', auth, requireRole(['provider']), serviceController.updateService);
app.delete('/api/provider/services/:id', auth, requireRole(['provider']), serviceController.deleteService);

app.get('/api/provider/availability', auth, requireRole(['provider']), availabilityController.getMySlots);
app.post('/api/provider/availability', auth, requireRole(['provider']), availabilityController.addSlot);

app.get('/api/provider/blocked-dates', auth, requireRole(['provider']), blockedDatesController.getMyBlockedDates);
app.post('/api/provider/blocked-dates', auth, requireRole(['provider']), blockedDatesController.blockDate);

app.get('/api/provider/bookings', auth, requireRole(['provider']), bookingController.getProviderBookings);
app.put('/api/provider/bookings/:id/status', auth, requireRole(['provider']), bookingController.updateBookingStatus);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Server on', PORT));