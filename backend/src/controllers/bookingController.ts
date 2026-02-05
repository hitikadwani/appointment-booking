import { Response } from 'express';
import { AuthReq } from '../middleware/auth';
import { query } from '../db/connection';

async function getProviderId(userId: number): Promise<number> {
  const r = await query('SELECT id FROM providers WHERE user_id = $1', [userId]);
  return r.rows[0].id;
}

export async function createBooking(req: AuthReq, res: Response) {
  const { provider_id, service_id, appointment_date, appointment_time, notes } = req.body;
  const userId = req.userId!;

  // Verify service exists and belongs to provider
  const serviceCheck = await query(
    'SELECT id FROM services WHERE id = $1 AND provider_id = $2',
    [service_id, provider_id]
  );
  if (serviceCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Service not found for this provider' });
  }

  // Check if date is blocked
  const blocked = await query(
    'SELECT id FROM blocked_dates WHERE provider_id = $1 AND blocked_date = $2',
    [provider_id, appointment_date]
  );
  if (blocked.rows.length > 0) {
    return res.status(400).json({ error: 'Date blocked' });
  }

  // Check availability
  const dayOfWeek = new Date(appointment_date).getDay();
  const slot = await query(
    'SELECT id FROM availability_slots WHERE provider_id = $1 AND day_of_week = $2 AND start_time <= $3 AND end_time >= $3 AND is_active = true',
    [provider_id, dayOfWeek, appointment_time]
  );
  if (slot.rows.length === 0) {
    return res.status(400).json({ error: 'Slot not available' });
  }

  // Check if already booked
  const existing = await query(
    'SELECT id FROM appointments WHERE provider_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status != $4',
    [provider_id, appointment_date, appointment_time, 'cancelled']
  );
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'Already booked' });
  }

  const result = await query(
    'INSERT INTO appointments (user_id, provider_id, service_id, appointment_date, appointment_time, notes, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [userId, provider_id, service_id, appointment_date, appointment_time, notes || null, 'pending']
  );
  res.status(201).json(result.rows[0]);
}

export async function getMyBookings(req: AuthReq, res: Response) {
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
    [req.userId]
  );
  res.json(result.rows);
}

export async function getProviderBookings(req: AuthReq, res: Response) {
  const providerId = await getProviderId(req.userId!);
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
  res.json(result.rows);
}

export async function confirmBooking(req: AuthReq, res: Response) {
  const { id } = req.params;
  const providerId = await getProviderId(req.userId!);
  const result = await query(
    "UPDATE appointments SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND provider_id = $2 RETURNING *",
    [id, providerId]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(result.rows[0]);
}

export async function cancelBooking(req: AuthReq, res: Response) {
  const { id } = req.params;
  const result = await query(
    "UPDATE appointments SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND (user_id = $2 OR provider_id = (SELECT id FROM providers WHERE user_id = $2)) RETURNING *",
    [id, req.userId]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(result.rows[0]);
}

export async function updateBookingStatus(req: AuthReq, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const providerId = await getProviderId(req.userId!);
  
      // Validate status
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status. Must be one of: pending, confirmed, cancelled, completed' 
        });
      }
  
      // Verify booking belongs to provider
      const bookingCheck = await query(
        'SELECT id, status FROM appointments WHERE id = $1 AND provider_id = $2',
        [id, providerId]
      );
  
      if (bookingCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }
  
      // Update the status
      const result = await query(
        'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND provider_id = $3 RETURNING *',
        [status, id, providerId]
      );
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update booking status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
}
  