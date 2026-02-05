import { query } from './db';

export async function getProviderId(userId: number): Promise<number> {
  const r = await query('SELECT id FROM providers WHERE user_id = $1', [userId]);
  return r.rows[0].id;
}
