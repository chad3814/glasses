import { Book } from "@prisma/client";
import db, { Client } from "@/models/db";

type RelatedBook = {
    id: number;
    binding: string | null;
};

export type AuthorData = {
    id: number;
    name: string;
    books: BookData[];
}
export type BookAuthor = Omit<AuthorData, 'books'>;

export type BookData = Omit<Book, 'datePublished'> & {
    authors: BookAuthor[];
    datePublished?: number | Date;
    episodeIds: string[];
    relatedBooks: RelatedBook[];
};

export async function bookToBookData(book: Book, $tx: Client = db): Promise<BookData> {
    const [authors, episodeIds, related] = await Promise.all([
        await $tx.authorBook.findMany({
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            where: {
                bookId: book.id,
            },
        }),
        await $tx.episode.findMany({
            select: {
                id: true,
            },
            where: {
                books: {
                    some: {
                        id: book.id,
                    },
                },
            },
        }),
        await $tx.relatedBook.findMany({
            include: {
                bookA: {
                    select: {
                        id: true,
                        binding: true,
                    },
                },
                bookB: {
                    select: {
                        id: true,
                        binding: true,
                    },
                },
            },
            where: {
                OR: [{
                    bookIdA: book.id,
                },
                {
                    bookIdB: book.id,
                }],
            },
        }),
    ]);

    const map = new Map<number, RelatedBook>();
    for (const rel of related) {
        if (rel.bookA.id === book.id) {
            map.set(rel.bookB.id, rel.bookB);
        } else {
            map.set(rel.bookA.id, rel.bookA);
        }
    }
    const ret: BookData = Object.assign(
        {},
        book,
        {
            authors: authors.map(
                ({author}) => author
            ),
            datePublished: book.datePublished?.getTime(),
            episodeIds: episodeIds.map(episode => episode.id),
            relatedBooks: [...map.values()],
        },
    );
    return ret;
}

export function bookDataToBookData(bookData: BookData): BookData {
    if (bookData.datePublished == null) {
        return bookData;
    }
    return {...bookData, datePublished: new Date(bookData.datePublished)};
}
