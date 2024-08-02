import { Work } from "@prisma/client";
import { AuthorData, authorToAuthorData } from "./authorData";
import db from "@/models/db";

export type WorkData = Omit<Work, 'authorId'> & {
    author: AuthorData;
    bookIds: number[];
};

export async function workToWorkData(work: Work, $tx = db): Promise<WorkData> {
    const [author, books] = await Promise.all([
        $tx.author.findFirst({
            where: {
                id: work.authorId,
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

    if (!author) {
        throw new Error('no author for work');
    }

    const ret = Object.assign(
        {},
        work,
        {
            author: await authorToAuthorData(author, $tx),
            bookIds: books.map(book => book.id),
        },
    );
    return ret;
}
