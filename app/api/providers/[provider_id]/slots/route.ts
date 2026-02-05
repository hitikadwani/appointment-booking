import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider_id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const { provider_id } = await params;

    if (!date) {
      return NextResponse.json(
        { error: 'date query parameter required' },
        { status: 400 }
      );
    }

    const dayOfWeek = new Date(date).getDay();

    // Check if date is blocked
    const blocked = await query(
      'SELECT id FROM blocked_dates WHERE provider_id = $1 AND blocked_date = $2',
      [provider_id, date]
    );
    if (blocked.rows.length > 0) {
      return NextResponse.json([]);
    }

    // Get availability slots for that day
    const slots = await query(
      'SELECT start_time, end_time FROM availability_slots WHERE provider_id = $1 AND day_of_week = $2 AND is_active = true ORDER BY start_time',
      [provider_id, dayOfWeek]
    );

    if (slots.rows.length === 0) {
      return NextResponse.json([]);
    }

    // Get existing bookings for that date
    const booked = await query(
      'SELECT appointment_time FROM appointments WHERE provider_id = $1 AND appointment_date = $2 AND status NOT IN ($3, $4)',
      [provider_id, date, 'cancelled', 'rejected']
    );

    const bookedSet = new Set(booked.rows.map((r: any) => r.appointment_time));

    // Generate hourly slots
    const availableSlots: string[] = [];
    const slotDurationMinutes = 60; // 1 hour slots

    slots.rows.forEach((slot: any) => {
      const startTime = slot.start_time; // e.g., "09:00:00"
      const endTime = slot.end_time; // e.g., "17:00:00"

      // Parse start and end times
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      let currentHour = startHour;
      let currentMin = startMin;

      // Generate slots in 1-hour intervals
      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

        // Check if this slot is not booked
        if (!bookedSet.has(timeStr) && !bookedSet.has(`${timeStr}:00`)) {
          availableSlots.push(timeStr);
        }

        // Move to next hour
        currentMin += slotDurationMinutes;
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60);
          currentMin = currentMin % 60;
        }
      }
    });

    return NextResponse.json(availableSlots);
  } catch (error) {
    console.error('Get available slots error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
