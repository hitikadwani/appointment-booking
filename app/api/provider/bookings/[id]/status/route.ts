import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth-utils';
import { getProviderId } from '@/lib/provider-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(request, ['provider']);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { id } = await params;
    const { status } = await request.json();
    const providerId = await getProviderId(user.userId);

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: 'Invalid status. Must be one of: pending, confirmed, cancelled, completed',
        },
        { status: 400 }
      );
    }

    // Verify booking belongs to provider
    const bookingCheck = await query(
      'SELECT id, status FROM appointments WHERE id = $1 AND provider_id = $2',
      [id, providerId]
    );

    if (bookingCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Update the status
    const result = await query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND provider_id = $3 RETURNING *',
      [status, id, providerId]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Update booking status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
