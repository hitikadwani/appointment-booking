import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from './connection';

export async function initDb() {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  await query(schema);
}