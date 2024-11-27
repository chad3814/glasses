import db from '@/models/db';
import { bookToBookData } from '@/types/bookData';
import { SearchResponse } from '@/types/searchResponse';
import { tokenize } from '@/utils/tokenize';
import { Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function search(req: NextApiRequest, res: NextApiResponse<SearchResponse>) {
    const query = req.query.q;
    if (!query || Array.isArray(query)) {
        res.status(400).json({results:[]});
        return;
    }

    const tokens = tokenize(query);
    const OR: Prisma.WordSearchWhereInput[] = tokens.map(
        token => ({
            word: token.toLowerCase(),
        }),
    );

    const searchRes = await db.wordSearch.groupBy({
        by: 'bookId',
        where: {
            OR,
            score: {
                gt: 2,
            }
        },
        _sum: {
            score: true,
        },
        orderBy: {
            _sum: {
                score: 'desc',
            },
        },
        // having: {
        //     _sum: {
        //         score: {
        //             gt: 2
        //         }
        //     }
        // },
        take: 10,
    });

    const books = await db.book.findMany({
        where: {
            id: {
                in: searchRes.map(
                    res => res.bookId,
                ),
            },
        },
    });

    const bookDatas = await Promise.all(books.map(book => bookToBookData(book)));
    const response: SearchResponse = {
        results: bookDatas.map(
            book => ({
                book,
                score: searchRes.find(
                    res => res.bookId === book.id,
                )?._sum.score ?? undefined,
            }),
        ).sort(
            (a, b) => {
                if (b.score && a.score) return b.score - a.score;
                if (b.score) return -1;
                if (a.score) return 1;
                return 0;
            }
        ),
    };


    res.status(200).json(response);
    return;
}
