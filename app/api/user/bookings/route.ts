import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['user']);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    const result = await query(
      `SELECT 
        a.*, 
        u.name as provider_name,
        p.provider_type,
        s.name as service_name,
        s.price
       FROM appointments a
       JOIN providers p ON a.provider_id = p.id 
       JOIN users u ON p.user_id = u.id
       JOIN services s ON a.service_id = s.id
       WHERE a.user_id = $1 
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [user.userId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Get my bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['user']);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { provider_id, service_id, appointment_date, appointment_time, notes } =
      await request.json();

    // Verify service exists and belongs to provider
    const serviceCheck = await query(
      'SELECT id FROM services WHERE id = $1 AND provider_id = $2',
      [service_id, provider_id]
    );
    if (serviceCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Service not found for this provider' },
        { status: 404 }
      );
    }

    // Check if date is blocked
    const blocked = await query(
      'SELECT id FROM blocked_dates WHERE provider_id = $1 AND blocked_date = $2',
      [provider_id, appointment_date]
    );
    if (blocked.rows.length > 0) {
      return NextResponse.json({ error: 'Date blocked' }, { status: 400 });
    }

    // Check availability
    const dayOfWeek = new Date(appointment_date).getDay();
    const slot = await query(
      'SELECT id FROM availability_slots WHERE provider_id = $1 AND day_of_week = $2 AND start_time <= $3 AND end_time >= $3 AND is_active = true',
      [provider_id, dayOfWeek, appointment_time]
    );
    if (slot.rows.length === 0) {
      return NextResponse.json({ error: 'Slot not available' }, { status: 400 });
    }

    // Check if already booked
    const existing = await query(
      'SELECT id FROM appointments WHERE provider_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status != $4',
      [provider_id, appointment_date, appointment_time, 'cancelled']
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Already booked' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO appointments (user_id, provider_id, service_id, appointment_date, appointment_time, notes, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [
        user.userId,
        provider_id,
        service_id,
        appointment_date,
        appointment_time,
        notes || null,
        'pending',
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
