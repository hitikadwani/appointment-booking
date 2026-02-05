# Deployment Guide for Appointment Booking App

This guide explains how to deploy your appointment booking application to Vercel with the backend integrated as Next.js API routes.

## Architecture

The application is now a **monolithic Next.js app** with:
- **Frontend**: React components in the `app/` directory
- **Backend**: Next.js API routes in `app/api/` directory
- **Database**: PostgreSQL (Neon) - already configured

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A GitHub account with your code pushed to a repository
3. A Neon PostgreSQL database (you already have this)

## Deployment Steps

### 1. Push Your Code to GitHub

```bash
git add .
git commit -m "Convert backend to Next.js API routes"
git push origin main
```

### 2. Connect to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it as a Next.js project

### 3. Configure Environment Variables

In the Vercel project settings, add these environment variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_o6zUESRTqJv0@ep-ancient-hat-aiwixdwn-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

JWT_SECRET=appointment-booking-application-secret-key

NODE_ENV=production
```

⚠️ **Important**: Use a strong, unique JWT_SECRET in production!

### 4. Deploy

Click "Deploy" and Vercel will:
- Install dependencies
- Build your Next.js application
- Deploy both frontend and API routes

### 5. Database Initialization

If your database tables don't exist yet, you can initialize them by:

1. Running the SQL from `lib/schema.sql` directly in your Neon dashboard, OR
2. Creating a one-time initialization endpoint (see below)

## Environment Variables Explained

- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing (change in production!)
- `NODE_ENV`: Set to `production` for production builds

## Project Structure

```
/app
  /api                    # Backend API routes (serverless functions)
    /auth
      /register
      /login
      /logout
      /me
    /providers
    /user
    /provider
  /(auth)                 # Frontend auth pages
  /provider               # Frontend provider pages
  /user                   # Frontend user pages
  
/lib
  db.ts                   # Database connection
  auth-utils.ts           # Authentication utilities
  provider-utils.ts       # Provider helper functions
  api.ts                  # API client (axios)

/types
  index.ts                # TypeScript types
```

## Differences from Previous Setup

### Before (2 separate deployments):
- Frontend on Vercel
- Backend on Railway/Render
- Required CORS configuration
- Separate environment variables for each
- Two deployment processes

### Now (1 deployment):
- Everything on Vercel
- No CORS needed (same origin)
- Single set of environment variables
- One deployment process
- API routes are serverless functions

## Benefits of This Approach

1. **Single Deployment**: One command deploys everything
2. **No CORS Issues**: API and frontend share the same domain
3. **Automatic Scaling**: Vercel scales serverless functions automatically
4. **Better Integration**: Shared TypeScript types and utilities
5. **Simplified Environment**: One set of environment variables
6. **Cost Effective**: Vercel's free tier is generous for Next.js

## Post-Deployment

After deployment, your app will be available at:
```
https://your-project-name.vercel.app
```

All API routes will be at:
```
https://your-project-name.vercel.app/api/*
```

## Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` is correctly set in Vercel environment variables
- Check that your Neon database allows connections from anywhere (it should by default)

### JWT Token Issues
- Make sure `JWT_SECRET` is set
- In production, use a strong secret key (at least 32 characters)

### Build Failures
- Check the Vercel build logs
- Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify

## Development

To run locally:

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Neon PostgreSQL](https://neon.tech/docs)
