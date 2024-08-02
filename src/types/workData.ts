import { Work } from "@prisma/client";
import { AuthorData, authorToAuthorData } from "./authorData";
import db from "@/models/db";

export type WorkData = Work & {
    authors: AuthorData[];
    bookIds: number[];
};

export async function workToWorkData(work: Work, $tx = db): Promise<WorkData> {
    const [authors, books] = await Promise.all([
        $tx.author.findMany({
            where: {
                works: {
                    some: {
                        id: work.id,
                    },
                },
            },
        }),
        $tx.book.findMany({
            select: {
                id: true,
            },
            where: {
                workId: work.id,
            },
        }),
    ]);

    if (!authors || authors.length === 0) {
        throw new Error('no authors for work');
    }

    const ret = Object.assign(
        {},
        work,
        {
            authors: await Promise.all(authors.map(author => authorToAuthorData(author, $tx))),
            bookIds: books.map(book => book.id),
        },
    );
    return ret;
}
