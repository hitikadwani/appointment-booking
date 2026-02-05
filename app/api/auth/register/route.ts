import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { COOKIE_OPTIONS } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, provider_type } = await request.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (!['user', 'provider'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (role === 'provider' && !provider_type) {
      return NextResponse.json(
        { error: 'Provider type required for providers' },
        { status: 400 }
      );
    }

    if (role === 'provider' && !['doctor', 'salon', 'car-rental'].includes(provider_type)) {
      return NextResponse.json({ error: 'Invalid provider type' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, hash, name, role]
    );
    const user = result.rows[0];

    if (role === 'provider') {
      await query('INSERT INTO providers (user_id, provider_type) VALUES ($1, $2)', [
        user.id,
        provider_type,
      ]);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Set token in httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('token', token, COOKIE_OPTIONS);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          ...(role === 'provider' && { provider_type }),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Register error:', error);
    if (error.code === '23505') {
      // Unique violation
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
