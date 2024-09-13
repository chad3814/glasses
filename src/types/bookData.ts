import { Book } from "@prisma/client";
import db from "@/models/db";

export type BookData = Omit<Book, 'workId'> & {
    work: {
        id: number;
        title: string;
        description?: string;
        author: {
            id: number;
            name: string;
            bookshopUrl?: string;
            works: {
                id: number;
                title: string;
            }[];
        },
        books: {
            id: number;
            isbn: string;
            format: string;
            imageUrl?: string;
            episodes: {
                id: string;
                title: string;
            }[];
        }[];
    };
};

export async function bookToBookData(book: Book, $tx = db): Promise<BookData> {
    const work = await $tx.work.findFirst({
        include: {
            author: {
                include: {
                    works: {
                        select: {
                            id: true,
                            title: true,
                        }
                    },
                },
            },
            books: {
                select: {
                    id: true,
                    format: true,
                    imageUrl: true,
                    isbn: true,
                    episodes: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            },
        },
        where: {
            id: book.workId,
        },
    });

    if (!work) {
        throw new Error('No work for book');
    }
    const ret: BookData = Object.assign(
        {},
        book,
        {
            work: {
                id: work.id,
                title: work.title,
                description: work.description ?? undefined,
                author: {
                    id: work.author.id,
                    name: work.author.name,
                    bookshopUrl: work.author.bookshopUrl ?? undefined,
                    works: work.author.works.map(
                        w => ({
                            id: w.id,
                            title: w.title,
                        })
                    ),
                },
                books: work.books.map(
                    b => ({
                        id: b.id,
                        isbn: b.isbn,
                        format: b.format,
                        imageUrl: b.imageUrl ?? undefined,
                        episodes: b.episodes.map(
                            e => ({
                                id: e.id,
                                title: e.title,
                            }),
                        ),
                    }),
                ),
            }
        },
    );
    return ret;
}
