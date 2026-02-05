import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth-utils';
import { getProviderId } from '@/lib/provider-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(request, ['provider']);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { id } = await params;
    const { name, description, price } = await request.json();
    const providerId = await getProviderId(user.userId);

    await query(
      'UPDATE services SET name = COALESCE($1, name), description = COALESCE($2, description), price = COALESCE($3, price), updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND provider_id = $5',
      [name, description, price, id, providerId]
    );

    const result = await query('SELECT * FROM services WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(request, ['provider']);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { id } = await params;
    const providerId = await getProviderId(user.userId);

    const result = await query(
      'DELETE FROM services WHERE id = $1 AND provider_id = $2 RETURNING id',
      [id, providerId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ msg: 'Deleted' });
  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
