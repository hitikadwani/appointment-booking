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

    // Validate input
    if (!start_time || !end_time) {
      return NextResponse.json({ error: 'Start time and end time are required' }, { status: 400 });
    }

    if (start_time >= end_time) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // Check for overlapping time slots on the same day
    const existingSlots = await query(
      `SELECT * FROM availability_slots 
       WHERE provider_id = $1 
       AND day_of_week = $2 
       AND is_active = true`,
      [providerId, day_of_week]
    );

    // Check if the new slot overlaps with any existing slot
    for (const slot of existingSlots.rows) {
      const existingStart = slot.start_time;
      const existingEnd = slot.end_time;

      // Check for overlap:
      // New slot starts before existing ends AND new slot ends after existing starts
      if (start_time < existingEnd && end_time > existingStart) {
        return NextResponse.json(
          { error: `Time slot overlaps with existing slot: ${existingStart} - ${existingEnd}` },
          { status: 400 }
        );
      }
    }

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
