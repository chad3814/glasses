import 'dot-env';
import db, { Client } from './db';
import { Book, Prisma } from '@prisma/client';
import { queue } from 'async';
import { sleep } from '@/utils/sleep';
import { take } from '@/utils/take';
import { getOrCreateBooksByIsbnBooks } from './book';
import { tokenize } from '@/utils/tokenize';

export type IsbnDbBook = {
    title: string;
    title_long: string;
    isbn: string;
    isbn10: string;
    isbn13: string;
    dewey_decimal?: string;
    binding?: string;
    publisher?: string;
    language?: string;
    date_published?: string;
    edition?: string;
    pages?: number;
    dimensions?: string;
    dimensions_structured?: {
        length: {
            unit: string;
            value: number;
        };
        width: {
            unit: string;
            value: number;
        };
        height: {
            unit: string;
            value: number;
        };
        weight: {
            unit: string;
            value: number;
        };
    };
    overview?: string;
    image?: string;
    msrp?: number;
    excerpt?: string;
    synopsis?: string;
    authors?: string[];
    subjects?: string[];
    reviews?: string[];
    other_isbns?: {
        isbn: string;
        binding: string;
    }[];
};

type IsbnDbBookData = {
    book: IsbnDbBook;
};

export function isbnDataToCreateInput(book: IsbnDbBook): Prisma.BookCreateInput {
    const input: Prisma.BookCreateInput = {
        title: book.title,
        longTitle: book.title_long,
        isbn10: book.isbn10 ?? book.isbn,
        isbn13: book.isbn13,
        deweyDecimal: book.dewey_decimal,
        binding: book.binding,
        publisher: book.publisher,
        language: book.language,
        datePublished: book.date_published ? new Date(book.date_published) : undefined,
        edition: String(book.edition),
        pages: book.pages,
        length: book.dimensions_structured?.length?.value,
        width: book.dimensions_structured?.width?.value,
        height: book.dimensions_structured?.height?.value,
        weight: book.dimensions_structured?.weight?.value,
        lengthUnit: book.dimensions_structured?.length?.unit,
        widthUnit: book.dimensions_structured?.width?.unit,
        heightUnit: book.dimensions_structured?.height?.unit,
        weightUnit: book.dimensions_structured?.weight?.unit,
        overview: book.overview,
        coverImage: book.image,
        excerpt: book.excerpt,
        synopsis: book.synopsis,
        subjects: book.subjects,
    };

    if (book.date_published && Number.isNaN(input.datePublished!.valueOf())) {
        let parts = book.date_published.split('/');
        if (parts.length === 2) {
            if (parts[0].length === 4) {
                input.datePublished = new Date(`${parts[0]}-${parts[1]}-01`);
            } else if (parts[1].length === 4) {
                input.datePublished = new Date(`${parts[1]}-${parts[0]}-01`);
            } else {
                input.datePublished = undefined;
            }
        } else {
            parts = book.date_published.split('-');
            if (parts.length === 2) {
                if (parts[0].length === 4) {
                    input.datePublished = new Date(`${parts[0]}-${parts[1]}-01`);
                } else if (parts[1].length === 4) {
                    input.datePublished = new Date(`${parts[1]}-${parts[0]}-01`);
                } else {
                    input.datePublished = undefined;
                }
            } else {
                input.datePublished = undefined;
            }
        }
    }

    return input;
}

const isbnDbWorker = async (url: string) => {
    const start = Date.now();
    const ISBNDB_KEY = process.env.ISBNDB_KEY;
    if (!ISBNDB_KEY) {
        throw new Error('No ISBNDb key set');
    }

    const options = {
        headers: {
            Accept: 'application/json',
            Authorization: ISBNDB_KEY,
        },
    };

    const res = await fetch(url, options);
    if (!res.ok) {
        throw new Error(`Bad response ${res.status} - ${res.statusText}`);
    }

    const isbnData = await res.json();

    const end = Date.now();
    const elapsed = end - start;
    if (elapsed < 1000) {
        await sleep(1000 - elapsed);
    }

    return isbnData;
}

const q = queue(isbnDbWorker, 1);

export async function importBookByIsbn13(isbn: string, $tx?: Client): Promise<Book | null> {
    const isbnData = await q.push(`https://api2.isbndb.com/book/${isbn}`) as IsbnDbBookData;

    if (!isbnData?.book) {
        console.error('no data for isbn', isbn, JSON.stringify(isbnData, null, 4));
        return null;
    }

    return await addIsbnBook(isbnData.book, $tx ?? db);
}

export async function addIsbnBook(isbnBook: IsbnDbBook, $tx: Client) {
    const data: Prisma.BookCreateInput = isbnDataToCreateInput(isbnBook);
    const wordScores: { word: string; score: number; }[] = [];
    const titleTokens = new Set<string>(tokenize(`${isbnBook.title} ${isbnBook.title_long ?? ''}`));
    const authorTokens = new Set<string>(tokenize(isbnBook.authors?.join(' ') ?? ''));
    for (const word of titleTokens.values()) {
        wordScores.push({word, score: 10});
    }
    for (const word of authorTokens.values()) {
        wordScores.push({word, score: 5});
    }
    if (isbnBook.overview) {
        const wordTokens = tokenize(isbnBook.overview);
        for (const word of wordTokens) {
            wordScores.push({word, score: 1});
        }
    }
    data.wordSearch = {
        createMany: {
            data: wordScores,
            skipDuplicates: true,
        }
    }

    const book = await $tx.book.create({
        data,
    });

    if (!book) {
        throw new Error('Failed to save book');
    }

    if (isbnBook.authors) {
        const authors = await $tx.author.createManyAndReturn({
            data: isbnBook.authors.map(
                name => ({ name })
            ),
            skipDuplicates: true,
        });

        await $tx.authorBook.createMany({
            data: authors.map(
                ({id: authorId}) => ({
                    authorId,
                    bookId: book.id
                })
            ),
        });
    }
    // const titleTokens = new Set<string>(tokenize(`${book.title} ${book.longTitle ?? ''}`));
    // const nameTokens = new Set<string>(tokenize(isbnBook.authors?.join(' ') ?? ''));
    // const wordSearchPromises = [
    //     $tx.wordSearch.createMany({
    //         data: [...titleTokens.values()].map(
    //             word => ({word, bookId: book.id, score: 5})
    //         ),
    //         skipDuplicates: true,
    //     }),
    //     $tx.wordSearch.createMany({
    //         data: [...nameTokens.values()].map(
    //             word => ({word, bookId: book.id, score: 5})
    //         ),
    //         skipDuplicates: true,
    //     }),
    // ];
    // if (data.overview) {
    //     wordSearchPromises.push(
    //         $tx.wordSearch.createMany({
    //             data: tokenize(data.overview).map(
    //                 word => ({word, bookId: book.id, score: 1}),
    //             ),
    //             skipDuplicates: true,
    //         }),
    //     );
    // }

    // await Promise.all(wordSearchPromises);

    return book;
}

type IsbnSearchResult = {
    total: number;
    books: IsbnDbBook[];
};

export async function importBooksByDate(date: string): Promise<number[]> {
    const bookIds: number[] = [];
    const year = date.substring(0, 4);
    const fpUrl = `https://api2.isbndb.com/books/${date}?page=1&pageSize=${1000}&column=date_published&year=${year}&shouldMatchAll=0`;
    const firstPage = await q.push(fpUrl) as IsbnSearchResult;
    if (!firstPage) {
        console.log('first page failed', q.length(), q.running());
        console.log(fpUrl);
    }
    const total = firstPage.total;
    const urls: string[] = [];
    const numPages = Math.ceil(total / 1000);
    console.log(`date ${date} has ${total}, ${numPages} pages`);
    for (let i = 2; i <= numPages; i++) {
        console.log(`page ${i} of date ${date}`);
        urls.push(`https://api2.isbndb.com/books/${date}?page=${i}&pageSize=${1000}&column=date_published&year=${year}&shouldMatchAll=0`);
    }
    const pages = await Promise.all(
        urls.map(
            url => q.push(url)
        ) as Promise<IsbnSearchResult>[]
    );
    pages.unshift(firstPage);
    for (const page of pages) {
        for (const books of take(10, page.books)) {
            await db.$transaction(
                async $tx => {
                    const data = books.map(isbnDataToCreateInput);
                    const ids = await $tx.book.createManyAndReturn({
                        select: {
                            id: true,
                            isbn13: true,
                        },
                        data,
                        skipDuplicates: true,
                    });
                    bookIds.push(...(ids.map(i => i.id)));

                    const authors = await $tx.author.createManyAndReturn({
                        data: books.map(
                            isbnBook => {
                                if (!isbnBook.authors) {
                                    return undefined;
                                }
                                return isbnBook.authors.map(
                                    name => ({
                                        name,
                                    })
                                );
                            },
                        ).filter(d => !!d).flat(),
                        skipDuplicates: true,
                    });

                    await $tx.authorBook.createMany({
                        data: books.map(
                            isbnBook => {
                                const bookId = ids.find(
                                    ({isbn13}) => isbn13 === isbnBook.isbn13
                                )?.id;
                                if(!bookId) {
                                    return undefined;
                                }

                                const authorIds = authors.filter(
                                    ({name}) => isbnBook.authors?.includes(name)
                                ).map(i => i.id);

                                return authorIds.map(
                                    authorId => ({
                                        bookId,
                                        authorId
                                    })
                                );
                            }
                        ).filter(d => !!d).flat()
                    });

                    await $tx.wordSearch.createMany({
                        data: ids.map(
                            ({id: bookId, isbn13}) => {
                                const isbnBook = books.find(
                                    book => book.isbn13 === isbn13
                                );
                                if (!isbnBook) {
                                    return undefined;
                                }
                                const wordScore: {word: string; score: number; bookId: number;}[] = []
                                for (const word of tokenize(`${isbnBook.title} ${isbnBook.title_long}`)) {
                                    wordScore.push({
                                        word,
                                        score: 10,
                                        bookId,
                                    });
                                }

                                if (isbnBook.authors) {
                                    const names = tokenize(isbnBook.authors.join(' '));
                                    for (const word of names) {
                                        wordScore.push({
                                            word,
                                            score: 5,
                                            bookId,
                                        });
                                    }
                                }

                                if (isbnBook.overview) {
                                    for (const word of tokenize(`${isbnBook.overview}`)) {
                                        wordScore.push({
                                            word,
                                            score: 1,
                                            bookId,
                                        });
                                    }
                                }

                                return wordScore;
                            }
                        ).filter(d => !!d).flat(),
                        skipDuplicates: true,
                    });
                }
            );
        }
    }

    console.log(date, '-', bookIds.length, 'books');
    return bookIds;
}

export async function search(query: string): Promise<Book[] | null> {
    const url = `https://api2.isbndb.com/books/${query}?page=1&pageSize=${20}&column=title&shouldMatchAll=0`;
    const results = await q.push(url) as IsbnSearchResult;

    const books = await getOrCreateBooksByIsbnBooks(results?.books ?? []);

    return books;
}