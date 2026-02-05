import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider_id: string }> }
) {
  try {
    const { provider_id } = await params;

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

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Get provider services error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
