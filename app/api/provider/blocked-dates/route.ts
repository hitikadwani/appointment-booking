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
      'SELECT * FROM blocked_dates WHERE provider_id = $1 ORDER BY blocked_date',
      [providerId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Get blocked dates error:', error);
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
    const { blocked_date, reason } = await request.json();
    const providerId = await getProviderId(user.userId);

    const result = await query(
      'INSERT INTO blocked_dates (provider_id, blocked_date, reason) VALUES ($1, $2, $3) ON CONFLICT (provider_id, blocked_date) DO NOTHING RETURNING *',
      [providerId, blocked_date, reason || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Block date error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
