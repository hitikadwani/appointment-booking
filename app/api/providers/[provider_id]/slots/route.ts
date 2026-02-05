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

    // Parse date correctly to avoid timezone issues
    // Date string is in format YYYY-MM-DD
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed
    const dayOfWeek = dateObj.getDay();
    
    console.log('Date requested:', date, 'Day of week:', dayOfWeek, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]);

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

    // Get existing bookings for that date (only count pending, confirmed, and completed as occupied)
    const booked = await query(
      'SELECT appointment_time FROM appointments WHERE provider_id = $1 AND appointment_date = $2 AND status IN ($3, $4, $5)',
      [provider_id, date, 'pending', 'confirmed', 'completed']
    );

    // Normalize times to HH:MM format for comparison
    const bookedSet = new Set(
      booked.rows.map((r: any) => {
        const time = r.appointment_time;
        // Handle both "HH:MM:SS" and "HH:MM" formats
        return typeof time === 'string' ? time.substring(0, 5) : time;
      })
    );

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

        // Check if this slot is not booked (normalize to HH:MM format)
        if (!bookedSet.has(timeStr)) {
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
