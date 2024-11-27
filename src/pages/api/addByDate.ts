import { updateSearchWords } from '@/models/book';
import { importBooksByDate } from '@/models/isbndb';
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function addByDate(req: NextApiRequest, res: NextApiResponse<number[]>) {
    const date = req.query.date;
    if (!date || Array.isArray(date)) {
        throw new Error('Bad Input');
    }

    const bookIds = await importBooksByDate(date);
    console.log('added', bookIds.length, 'books');

    res.status(200).json(bookIds);
    return;
}
