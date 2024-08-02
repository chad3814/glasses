import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/models/db';
import { ErrorResponse } from '@/types/errorResponse';
import { Book } from '@prisma/client';

export default async function apiGetBook(req: NextApiRequest, res: NextApiResponse<Book|ErrorResponse>) {
    if (!req.query.bookId || Array.isArray(req.query.bookId)) {
        res.status(501).json({error: 'invalid bookId'});
        return;
    }
    const bookId: number = parseInt(req.query.bookId, 10);

    if (isNaN(bookId)) {
        res.status(501).json({error: 'invalid bookId'});
        return;
    }

    const book = await db.book.findFirst({
        where: {
            id: bookId,
        },
    });

    if (!book) {
        res.status(404).json({error: 'book not found'});
        return;
    }

    res.status(200).json(book);
    return;
}
