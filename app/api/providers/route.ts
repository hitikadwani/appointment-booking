import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider_type = searchParams.get('provider_type');

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
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Get providers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
