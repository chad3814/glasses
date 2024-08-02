import type { NextApiRequest, NextApiResponse } from 'next';
import { WorkData, workToWorkData } from '@/types/workData';
import db from '@/models/db';
import { ErrorResponse } from '@/types/errorResponse';

export default async function apiGetWork(req: NextApiRequest, res: NextApiResponse<WorkData|ErrorResponse>) {
    if (!req.query.workId || Array.isArray(req.query.workId)) {
        res.status(501).json({error: 'invalid workId'});
        return;
    }
    const workId: number = parseInt(req.query.workId, 10);

    if (isNaN(workId)) {
        res.status(501).json({error: 'invalid workId'});
        return;
    }

    const work = await db.work.findFirst({
        where: {
            id: workId,
        },
    });

    if (!work) {
        res.status(404).json({error: 'work not found'});
        return;
    }

    const workData = await workToWorkData(work);

    res.status(200).json(workData);
    return;
}
