import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/models/db';
import { ErrorResponse } from '@/types/errorResponse';
import { Author } from '@prisma/client';

export default async function apiAddWork(req: NextApiRequest, res: NextApiResponse<number|ErrorResponse>) {
    if (req.method !== 'POST') {
        res.status(404).json({error: 'bad method'});
        return;
    }

    const AuthorkData: Omit<Author, 'id'> = JSON.parse(req.body);
    const author = await db.author.create({
        data: AuthorkData
    });

    res.status(200).json(author.id);
}
