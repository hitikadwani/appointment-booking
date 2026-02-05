import { Request, Response } from 'express';
import { query } from '../db/connection';

// Get all providers (doctors, salons, car-rental)
export async function getProviders(req: Request, res: Response) {
  const { provider_type } = req.query;
  
  let queryText = `
    SELECT 
      p.id, 
      p.provider_type,
      u.name, 
      u.email, 
      p.bio 
    FROM providers p 
    JOIN users u ON p.user_id = u.id
  `;
  
  const params: any[] = [];
  if (provider_type) {
    queryText += ' WHERE p.provider_type = $1';
    params.push(provider_type);
  }
  
  queryText += ' ORDER BY p.provider_type, u.name';
  
  const result = await query(queryText, params);
  res.json(result.rows);
}

// Get services for a specific provider
export async function getProviderServices(req: Request, res: Response) {
  try {
    const { provider_id } = req.params;
    const result = await query(
      `SELECT 
        s.*,
        u.name as provider_name,
        p.provider_type
       FROM services s
       JOIN providers p ON s.provider_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE s.provider_id = $1`,
      [provider_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get provider services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get available time slots for a provider on a specific date
export async function getAvailableSlots(req: Request, res: Response) {
  try {
    const { provider_id, date } = req.query;
    
    if (!provider_id || !date) {
      return res.status(400).json({ error: 'provider_id and date required' });
    }
    
    const dayOfWeek = new Date(date as string).getDay();

    // Check if date is blocked
    const blocked = await query(
      'SELECT id FROM blocked_dates WHERE provider_id = $1 AND blocked_date = $2',
      [provider_id, date]
    );
    if (blocked.rows.length > 0) {
      return res.json([]);
    }

    // Get availability slots for that day
    const slots = await query(
      'SELECT start_time, end_time FROM availability_slots WHERE provider_id = $1 AND day_of_week = $2 AND is_active = true ORDER BY start_time',
      [provider_id, dayOfWeek]
    );
    
    if (slots.rows.length === 0) {
      return res.json([]);
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
      const endTime = slot.end_time;     // e.g., "17:00:00"

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

    res.json(availableSlots);
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}