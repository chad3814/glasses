import type { NextApiRequest, NextApiResponse } from 'next'

import { getOrCreateBookByIsbn } from '@/models/book';
import { BookData, bookToBookData } from '@/types/bookData';

export default async function addByIsbn(req: NextApiRequest, res: NextApiResponse<BookData | null>) {
    const isbn = req.query.isbn;
    if (!isbn || Array.isArray(isbn)) {
        throw new Error('Bad Input');
    }

    const b = await getOrCreateBookByIsbn(isbn);
    if (!b) {
        res.status(404).json(null);
        return;
    }
    const book = await bookToBookData(b);

    res.status(200).json(book);
    return;
}
