import { Author } from "@prisma/client";
import { WorkData, workToWorkData } from "./workData";
import db from "@/models/db";

export type AuthorData = Author & {
    works: WorkData[];
};

export async function authorToAuthorData(author: Author, $tx = db): Promise<AuthorData> {
    const works = await $tx.work.findMany({
        where: {
            authorId: author.id,
        },
    });

    const ret = Object.assign(
        {},
        author,
        {
            works: await Promise.all(works.map(work => workToWorkData(work, $tx))),
        },
    );
    return ret;
}
