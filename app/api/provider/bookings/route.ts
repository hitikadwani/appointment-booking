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
      `SELECT 
        a.*, 
        u.name as user_name,
        u.email as user_email,
        s.name as service_name
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       JOIN services s ON a.service_id = s.id
       WHERE a.provider_id = $1 
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [providerId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Get provider bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
