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
- **date-fns** for date manipulation

### Backend (API Routes)
- **Next.js API Routes** (Serverless Functions)
- **PostgreSQL** (Neon Database)
- **JWT** for authentication
- **bcryptjs** for password hashing
- **pg** for database connection

## Project Structure

```
/app
  /api                    # Backend API routes
    /auth                 # Authentication endpoints
    /providers            # Public provider endpoints
    /user                 # User-specific endpoints
    /provider             # Provider-specific endpoints
  /(auth)                 # Frontend auth pages
  /provider               # Provider dashboard pages
  /user                   # User dashboard pages
  
/lib
  db.ts                   # Database connection
  auth-utils.ts           # Authentication utilities
  provider-utils.ts       # Provider helper functions
  api.ts                  # Axios API client
  schema.sql              # Database schema

/types
  index.ts                # TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (we use Neon)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
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

## Deployment

This application is optimized for deployment on Vercel. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Import your repository to Vercel
3. Add environment variables (DATABASE_URL, JWT_SECRET, NODE_ENV)
4. Deploy!

The entire application (frontend + backend) deploys as a single Next.js application.

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

## Features Roadmap

- [ ] Email notifications for bookings
- [ ] Payment integration
- [ ] Calendar integration
- [ ] Reviews and ratings
- [ ] Multi-language support
- [ ] Mobile app (React Native)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js and PostgreSQL
