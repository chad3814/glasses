import { Author } from "@prisma/client";
import db from "../models/db";

export async function addWork(title: string, authorNames: string[], isbn: number) {
    const authors: Author[] = [];
    for (const authorName of authorNames) {
       let author = await db.author.findFirst({
            where: {
                name: authorName,
                }
        });
        if (!author) {
            author = await db.author.create({
                data: {
                    name: authorName,
                },
            });
        }
        authors.push(author);
    }

    let work = await db.work.findFirst({
        where: {
            title,
        }
    });
    if (!work) {
        work = await db.work.create({
            data: {
                title,
            }
        });
    }
    for (const author of authors) {
        await db.author.update({
            where: {
                id: author.id,
            },
            data: {
                works: {
                    connect: {
                        id: work.id,
                    }
                }
            }
        });
    }

    const book = await db.book.create({
        data: {
            workId: work.id,
            isbn,
        }
    });
}