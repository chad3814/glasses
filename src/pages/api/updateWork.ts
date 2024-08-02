import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/models/db';
import { ErrorResponse } from '@/types/errorResponse';
import { Work } from '@prisma/client';

export default async function apiUpdateWork(req: NextApiRequest, res: NextApiResponse<number|ErrorResponse>) {
    if (req.method !== 'POST') {
        res.status(404).json({error: 'bad method'});
        return;
    }

    const workData: Work = JSON.parse(req.body);
    const work = await db.work.update({
        data: workData,
        where: {
            id: workData.id,
        }
    });

    res.status(200).json(work.id);
}
