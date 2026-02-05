import { Response } from 'express';
import { AuthReq } from '../middleware/auth';
import { query } from '../db/connection';
import { getProviderId } from './serviceController';

export async function blockDate(req: AuthReq, res: Response) {
  const { blocked_date, reason } = req.body;
  const providerId = await getProviderId(req.userId!);
  const result = await query(
    'INSERT INTO blocked_dates (provider_id, blocked_date, reason) VALUES ($1, $2, $3) ON CONFLICT (provider_id, blocked_date) DO NOTHING RETURNING *',
    [providerId, blocked_date, reason || null]
  );
  res.status(201).json(result.rows[0]);
}

export async function getMyBlockedDates(req: AuthReq, res: Response) {
  const providerId = await getProviderId(req.userId!);
  const result = await query('SELECT * FROM blocked_dates WHERE provider_id = $1 ORDER BY blocked_date', [providerId]);
  res.json(result.rows);
}