import { Book } from '@prisma/client';
import db, { Client } from './db';
import { addIsbnBook, importBookByIsbn13, IsbnDbBook } from './isbndb';
import { tokenize } from '@/utils/tokenize';

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

export async function updateSearchWords(bookId: number, $tx: Client = db) {
    const book = await $tx.book.findFirstOrThrow({
        include: {
            authors: {
                include: {
                    author: {
                        select: {
                            name: true,
                        }
                    }
                }
            }
        },
        where: {
            id: bookId,
        }
    });

    const promises: Promise<any>[] = [];

    const titles = tokenize(`${book.title} ${book.longTitle}`);
    promises.push(
        $tx.wordSearch.createMany({
            data: titles.map(
                title => ({
                    word: title,
                    score: 10,
                    bookId,
                }),
            ),
            skipDuplicates: true,
        }),
    );
    const authors = tokenize(book.authors.map(authorBook => authorBook.author.name).join(' '));
    promises.push(
        $tx.wordSearch.createMany({
            data: authors.map(
                name => ({
                    word: name,
                    score: 5,
                    bookId,
                }),
            ),
            skipDuplicates: true,
        }),
    );

    if (book.overview) {
        const overview = tokenize(book.overview);
        promises.push(
            $tx.wordSearch.createMany({
                data: overview.map(
                    word => ({
                        word,
                        score: 1,
                        bookId,
                    }),
                ),
                skipDuplicates: true,
            }),
        );
    }

    await Promise.all(promises);
}