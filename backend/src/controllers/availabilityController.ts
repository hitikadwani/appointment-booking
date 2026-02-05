import { Response } from "express";
import { AuthReq } from "../middleware/auth";
import {query} from '../db/connection';
import { getProviderId } from './serviceController';

export async function addSlot(req: AuthReq, res: Response) {
    const { day_of_week, start_time, end_time } = req.body;
    const providerId= await getProviderId(req.userId!);
    const result = await query(
        'INSERT INTO availability_slots (provider_id,day_of_week,start_time,end_time) VALUES ($1,$2,$3,$4) RETURNING *',
        [providerId,day_of_week,start_time,end_time]
    );
    res.status(201).json(result.rows[0]);
}

export async function getMySlots(req:AuthReq, res: Response) {
    const providerId=await getProviderId(req.userId!);
    const result =await query('SELECT * FROM availability_slots where provider_id = $1 ORDER BY day_of_week, start_time',[providerId]);
    res.json(result.rows);
}