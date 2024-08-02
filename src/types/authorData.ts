import { Author } from "@prisma/client";
import db from "@/models/db";

export type AuthorData = Author & {
    workIds: number[];
    alternateNames: string[];
};

export async function authorToAuthorData(author: Author, $tx = db): Promise<AuthorData> {
    const [works, alternateNames] = await Promise.all([
        $tx.work.findMany({
            select: {
                id: true,
            },
            where: {
                authors: {
                    some: {
                        id: author.id,
                    },
                },
            },
        }),
        $tx.alternateName.findMany({
            select: {
                name: true,
            },
            where: {
                authorId: author.id,
            },
        }),
    ]);

    const ret = Object.assign(
        {},
        author,
        {
            workIds: works.map(work => work.id),
            alternateNames: alternateNames.map(alternateName => alternateName.name),
        },
    );
    return ret;
}
