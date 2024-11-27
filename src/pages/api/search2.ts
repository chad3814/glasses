import { BookData, bookToBookData } from '@/types/bookData';
import { search } from '@/models/isbndb';
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function searchIsbnDb(req: NextApiRequest, res: NextApiResponse<BookData[]>) {
    const query = req.query.q;
    if (!query || Array.isArray(query)) {
        res.status(400).json([]);
        return;
    }

    const books = await search(query);
    if (!books) {
        console.error('failed to serch');
        res.status(500).json([]);
        return;
    }

    res.status(200).json(await Promise.all(books.map(book => bookToBookData(book))));
    return;
}
