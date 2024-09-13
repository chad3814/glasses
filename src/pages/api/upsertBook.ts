import { getOrCreateAuthor, getOrCreateBook, getOrCreateWork } from '@/models/book';
import db from '@/models/db';
import { Format } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function apiUpsertBook(req: NextApiRequest, res: NextApiResponse<boolean>) {
    const {title, author, bsAuthorUrl, description, publishDate, pages, format, isbn, imageUrl} = req.body;

    let f: Format;
    switch (format) {
        default:
        case 'Hardcover':
            f = Format.hardcover;
            break;
        case 'Paperback':
        case 'Mass Market Paperbound':
            f = Format.paperback;
            break;
        case 'Compact Disc':
            f = Format.audio;
            break;
    }
    try {
        await db.$transaction(
            async $tx => {
                const a = await getOrCreateAuthor($tx, author, bsAuthorUrl);
                const w = await getOrCreateWork($tx, title, a);
                const b = await getOrCreateBook($tx, w, isbn, f);
                await $tx.work.update({
                    data: {
                        description,
                    },
                    where: {
                        id: w.id,
                    }
                });
                await $tx.book.update({
                    data: {
                        releaseDate: new Date(publishDate),
                        imageUrl,
                        pages,
                    },
                    where: {
                        id: b.id,
                    }
                })
            }
        );
        res.status(200).json(true);
    } catch (err) {
        console.error('error', err);
        res.status(500).json(false);
    }
}