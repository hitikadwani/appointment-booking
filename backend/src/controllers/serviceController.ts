import { Response } from 'express';
import { AuthReq } from '../middleware/auth';
import {query} from '../db/connection';

export async function getProviderId(userId: number): Promise<number> {
    const r = await query ('Select id from providers where user_id = $1', [userId]);
    return r.rows[0].id;
}

export async function createService(req: AuthReq,res: Response) {
    const { name, description, price } = req.body;
    const providerId = await getProviderId(req.userId!);
    const result = await query(
        'INSERT INTO services (provider_id,name, description, price) VALUES ($1,$2,$3,$4) RETURNING *',
        [providerId,name,description || null,price]
    );
    res.status(201).json(result.rows[0]);
}

export async function getMyServices(req: AuthReq, res: Response) {
    const providerId = await getProviderId(req.userId!);
    const result = await query ('SELECT * from services where provider_id = $1',[providerId]);
    res.json(result.rows);
}


export async function updateService(req: AuthReq,res: Response) {
    const { id } = req.params;
    const {name, description, price } = req.body;
    const providerId = await getProviderId(req.userId!);
    await query(
        'UPDATE services SET name = COALESCE($1, name), description = COALESCE($2, description), price = COALESCE($3, price), updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND provider_id = $5',
        [name,description,price,id,providerId]
    );
    const result = await query('SELECT * FROM services where id=$1', [id]);
    res.json(result.rows[0] || {error: 'NOT FOUND'});
}

export async function deleteService(req: AuthReq, res: Response) {
    const { id } =req.params;
    const providerId = await getProviderId(req.userId!);
    const result = await query('DELETE FROM services where id= $1 AND provider_id=$2 RETURNING id',[id,providerId]);
    if(result.rowCount===0) {
      return res.status(404).json({error: 'NOT FOUND' });
    }
    res.json({ msg: 'Deleted'});
}
