import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth-utils';
import { getProviderId } from '@/lib/provider-utils';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['provider']);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const providerId = await getProviderId(user.userId);

    const result = await query('SELECT * from services where provider_id = $1', [
      providerId,
    ]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Get my services error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['provider']);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { name, description, price } = await request.json();
    const providerId = await getProviderId(user.userId);

    const result = await query(
      'INSERT INTO services (provider_id, name, description, price) VALUES ($1, $2, $3, $4) RETURNING *',
      [providerId, name, description || null, price]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
