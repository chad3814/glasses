import { Author, Format, Work } from '@prisma/client';
import { Client } from './db';

export async function getOrCreateAuthor($tx: Client, name: string, bsAuthorUrl?: string) {
    let author = await $tx.author.findFirst({
        where: {
            name,
            bookshopUrl: bsAuthorUrl
        },
    });

    if (author) {
        return author;
    }

    author = await $tx.author.create({
        data: {
            name,
        },
    });
    return author;
}

export async function getOrCreateWork($tx: Client, title: string, author: Author) {
    let work = await $tx.work.findFirst({
        where: {
            title,
            authorId: author.id,
        },
    });

    if (work) {
        return work;
    }

    work = await $tx.work.create({
        data: {
            title,
            authorId: author.id,
        },
    });
    return work;
}

export async function getOrCreateBook($tx: Client, work: Work, isbn: string, format: Format = Format.hardcover) {
    let book = await $tx.book.findFirst({
        where: {
            isbn,
        },
    });

    if (book) {
        return book;
    }

    book = await $tx.book.create({
        data: {
            isbn,
            workId: work.id,
            format,
        },
    });
    return book;
}
