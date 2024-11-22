import db from '@/models/db';
import { BookData, bookToBookData } from '@/types/bookData';
import { tokenize } from '@/utils/tokenize';
import { Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function search(req: NextApiRequest, res: NextApiResponse<BookData[]>) {
    const query = req.query.q;
    if (!query || Array.isArray(query)) {
        res.status(400).json([]);
        return;
    }

    const tokens = tokenize(query);
    const OR: Prisma.BookWhereInput[] = tokens.map(
        token => ({
            title: {
                search: token
            }
        })
    );

    OR.push(...tokens.map(
        token => ({
            longTitle: {
                search: token
            }
        })
    ));

    const books = await db.book.findMany({
        where: {
            OR,
        },
        take: 10,
    });

    res.status(200).json(await Promise.all(books.map(book => bookToBookData(book))));
    return;
}
