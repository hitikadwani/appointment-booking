# Appointment Booking System

A full-stack appointment booking application built with Next.js 16, featuring integrated API routes, PostgreSQL database, and support for multiple service providers (doctors, salons, car rentals).

## Features

- **User Authentication**: Secure login/register with JWT tokens stored in httpOnly cookies
- **Provider Management**: Support for doctors, salons, and car rental services
- **Appointment Booking**: Real-time availability checking and booking system
- **Provider Dashboard**: Manage services, availability, blocked dates, and bookings
- **User Dashboard**: View and manage your appointments
- **Availability Management**: Set weekly schedules and block specific dates
- **Booking Status Management**: Pending, confirmed, cancelled, and completed statuses

## Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Axios** for API calls

### Backend (API Routes)
- **Next.js API Routes** (Serverless Functions)
- **PostgreSQL** (Neon Database)
- **JWT** for authentication
- **bcryptjs** for password hashing
- **pg** for database connection


```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (we use Neon)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:hitikadwani/appointment-booking.git
   cd appointment-booking
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Update the values:
   ```env
   DATABASE_URL='your_postgresql_connection_string'
   JWT_SECRET='your-secret-key'
   NODE_ENV=development
   ```

4. **Initialize the database**
   
   Run the SQL schema from `lib/schema.sql` in your PostgreSQL database.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Public
- `GET /api/providers` - List all providers
- `GET /api/providers/[id]/services` - Get provider services
- `GET /api/providers/[id]/slots` - Get available time slots

### User (Authenticated)
- `GET /api/user/bookings` - Get user's bookings
- `POST /api/user/bookings` - Create new booking
- `PUT /api/user/bookings/[id]/cancel` - Cancel booking

### Provider (Authenticated)
- `GET /api/provider/services` - Get provider's services
- `POST /api/provider/services` - Create new service
- `PUT /api/provider/services/[id]` - Update service
- `DELETE /api/provider/services/[id]` - Delete service
- `GET /api/provider/availability` - Get availability slots
- `POST /api/provider/availability` - Add availability slot
- `GET /api/provider/blocked-dates` - Get blocked dates
- `POST /api/provider/blocked-dates` - Block a date
- `GET /api/provider/bookings` - Get provider's bookings
- `PUT /api/provider/bookings/[id]/status` - Update booking status

## Database Schema

The application uses 6 main tables:
- **users** - User accounts (both customers and providers)
- **providers** - Provider-specific information
- **services** - Services offered by providers
- **availability_slots** - Weekly availability schedules
- **blocked_dates** - Specific dates when providers are unavailable
- **appointments** - Booking records

See `lib/schema.sql` for the complete schema.



## Development

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Lint Code
```bash
npm run lint
```

## Environment Variables

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing (use a strong value in production)
- `NODE_ENV` - Environment (development/production)






