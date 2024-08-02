import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/models/db';
import { ErrorResponse } from '@/types/errorResponse';
import { Book } from '@prisma/client';

export default async function apiUpdateBook(req: NextApiRequest, res: NextApiResponse<number|ErrorResponse>) {
    if (req.method !== 'POST') {
        res.status(404).json({error: 'bad method'});
        return;
    }

    const bookData: Book = JSON.parse(req.body);
    const book = await db.book.update({
        data: bookData,
        where: {
            id: bookData.id,
        }
    });

    res.status(200).json(book.id);
}
