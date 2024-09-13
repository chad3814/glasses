import { Author, Book, Format, Work } from '@prisma/client';
import { Client } from './db';

export async function getOrCreateBook(
    $tx: Client,
    isbn: string,
    authorName: string,
    title: string,
    description?: string,
    imageUrl?: string,
    bsAuthorUrl?: string,
    pages?: number,
    format: Format = Format.hardcover,
    releaseDate?: Date
) : Promise<Book | null> {
    let book = await $tx.book.findFirst({
        where: {
            isbn
        }
    });
    if (!book) {
        let author = await $tx.author.findFirst({
            where: {
                name: authorName,
            },
        });
        if (!author) {
            author = await $tx.author.create({
                data: {
                    name: authorName,
                    bookshopUrl: bsAuthorUrl,
                },
            });
        }

        const work = await $tx.work.upsert({
            create: {
                title,
                authorId: author.id,
                description,
            },
            update: {
                description,
            },
            where: {
                title_authorId: {
                    title,
                    authorId: author.id,
                },
            },
        });

        book = await $tx.book.create({
            data: {
                isbn,
                workId: work.id,
                format,
                releaseDate,
                pages,
                imageUrl,
            },
        });
    }
    return book;
}