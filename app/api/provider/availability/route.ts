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

    const result = await query(
      'SELECT * FROM availability_slots WHERE provider_id = $1 ORDER BY day_of_week, start_time',
      [providerId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Get my availability error:', error);
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
    const { day_of_week, start_time, end_time } = await request.json();
    const providerId = await getProviderId(user.userId);

    const result = await query(
      'INSERT INTO availability_slots (provider_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING *',
      [providerId, day_of_week, start_time, end_time]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Add availability slot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
