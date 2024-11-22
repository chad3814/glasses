import { Book } from '@prisma/client';
import db, { Client } from './db';
import { importBookByIsbn13 } from './isbndb';

export async function getBookByIsbn(isbn: string, $tx?: Client): Promise<Book | null> {
    $tx = $tx ?? db;
    return await $tx.book.findFirst({
        where: {
            isbn13: isbn
        }
    });
}

export async function getOrCreateBookByIsbn(isbn: string, $tx?: Client): Promise<Book | null> {
    console.log('getOrCreateBookByIsbn:', isbn);
    const book = await getBookByIsbn(isbn, $tx);

    if (book) {
        return book;
    }

    return await importBookByIsbn13(isbn, $tx);
}