import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/models/db';
import { ErrorResponse } from '@/types/errorResponse';
import { Work } from '@prisma/client';

export default async function apiAddWork(req: NextApiRequest, res: NextApiResponse<number|ErrorResponse>) {
    if (req.method !== 'POST') {
        res.status(404).json({error: 'bad method'});
        return;
    }

    const workData: Omit<Work, 'id'> = JSON.parse(req.body);
    const work = await db.work.create({
        data: workData
    });

    res.status(200).json(work.id);
}
