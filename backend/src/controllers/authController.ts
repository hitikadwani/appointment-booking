import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/connection';
import { AuthReq } from '../middleware/auth';

const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents JavaScript access (XSS protection)
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'lax' as const, // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export async function register(req: Request, res: Response) {
  const { email, password, name, role, provider_type } = req.body;
  
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  if (!['user', 'provider'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  if (role === 'provider' && !provider_type) {
    return res.status(400).json({ error: 'Provider type required for providers' });
  }

  if (role === 'provider' && !['doctor', 'salon', 'car-rental'].includes(provider_type)) {
    return res.status(400).json({ error: 'Invalid provider type' });
  }

  const hash = await bcrypt.hash(password, 10);
  const result = await query(
    'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
    [email, hash, name, role]
  );
  const user = result.rows[0];

  if (role === 'provider') {
    await query('INSERT INTO providers (user_id, provider_type) VALUES ($1, $2)', [user.id, provider_type]);
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
  
  // Set token in httpOnly cookie
  res.cookie('token', token, COOKIE_OPTIONS);
  
  res.status(201).json({ 
    user: { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role,
      ...(role === 'provider' && { provider_type })
    }
    // No token in response body - it's in cookie
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const result = await query(
    'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
    [email]
  );
  const user = result.rows[0];
  
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  let provider_type = null;
  if (user.role === 'provider') {
    const providerResult = await query(
      'SELECT provider_type FROM providers WHERE user_id = $1',
      [user.id]
    );
    if (providerResult.rows.length > 0) {
      provider_type = providerResult.rows[0].provider_type;
    }
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
  
  // Set token in httpOnly cookie
  res.cookie('token', token, COOKIE_OPTIONS);
  
  res.json({ 
    user: { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role,
      ...(provider_type && { provider_type })
    }
    // No token in response body
  });
}

export async function logout(req: Request, res: Response) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  res.json({ message: 'Logged out' });
}

// Get current user info (useful for Next.js server components)
export async function me(req: AuthReq, res: Response) {
  const userId = req.userId!;
  
  const result = await query(
    'SELECT id, email, name, role FROM users WHERE id = $1',
    [userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const user = result.rows[0];
  
  let provider_type = null;
  if (user.role === 'provider') {
    const providerResult = await query(
      'SELECT provider_type FROM providers WHERE user_id = $1',
      [userId]
    );
    if (providerResult.rows.length > 0) {
      provider_type = providerResult.rows[0].provider_type;
    }
  }
  
  res.json({ 
    user: { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role,
      ...(provider_type && { provider_type })
    }
  });
}