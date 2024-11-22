import { Book } from '@prisma/client';
import db, { Client } from './db';
import { addIsbnBook, importBookByIsbn13, IsbnDbBook } from './isbndb';

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

export async function getOrCreateBooksByIsbnBooks(isbnBooks: IsbnDbBook[], $tx?: Client): Promise<Book[] | null> {
    $tx = $tx ?? db;

    const books = await $tx.book.findMany({
        where: {
            isbn13: {
                in: isbnBooks.map(
                    isbnBook => isbnBook.isbn13
                ),
            },
        },
    });

    const existingIsbns = books.map(
        book => book.isbn13
    );

    const needed = isbnBooks.filter(
        isbnBook => !existingIsbns.includes(isbnBook.isbn13)
    );

    for (const isbnBook of needed) {
        const book = await addIsbnBook(isbnBook, $tx);
        books.push(book);
    }

    return books;
}
