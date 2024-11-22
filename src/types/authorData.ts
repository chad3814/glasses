import { Author } from "@prisma/client";
import db from "@/models/db";
import { BookData, bookToBookData } from "./bookData";

export type AuthorData = Author & {
    books: BookData[];
};

export async function authorToAuthorData(author: Author, $tx = db): Promise<AuthorData> {
    const books = await $tx.book.findMany({
        where: {
            authors: {
                some: {
                    id: author.id,
                },
            },
        },
    });

    const ret = Object.assign(
        {},
        author,
        {
            books: await Promise.all(books.map(
                book => bookToBookData(book, $tx)
            )),
        },
    );
    return ret;
}
