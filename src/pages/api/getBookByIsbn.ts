import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/models/db';
import { ErrorResponse } from '@/types/errorResponse';
import { Book } from '@prisma/client';

export default async function apiGetBookByIsbn(req: NextApiRequest, res: NextApiResponse<Book|ErrorResponse>) {
    if (!req.query.isbn || Array.isArray(req.query.isbn) || req.query.isbn.length !== 13) {
        res.status(501).json({error: 'invalid isbn'});
        return;
    }
    const isbn: number = parseInt(req.query.isbn, 10);

    if (isNaN(isbn)) {
        res.status(501).json({error: 'invalid isbn'});
        return;
    }

    const book = await db.book.findFirst({
        where: {
            isbn
        },
    });

    if (!book) {
        res.status(404).json({error: 'book not found'});
        return;
    }

    res.status(200).json(book);
    return;
}
