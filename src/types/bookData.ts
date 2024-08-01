import { Book } from "@prisma/client";
import { EpisodeData, episodeToEpisodeData } from "./episodeData";
import { WorkData, workToWorkData } from "./workData";
import db from "@/models/db";

export type BookData = Omit<Book, 'workId'> & {
    work: WorkData;
    episodeIds: string[];
};

export async function bookToBookData(book: Book, $tx = db): Promise<BookData> {
    const [work, episodeIds] = await Promise.all([
        $tx.work.findFirst({
            where: {
                id: book.workId,
            },
        }),
        $tx.episode.findMany({
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
    ]);
    if (!work) {
        throw new Error('No work for book');
    }
    const ret: BookData = Object.assign(
        {},
        book,
        {
            work: await workToWorkData(work),
            episodeIds: episodeIds.map(episode => episode.id),
        },
    );
    return ret;
}
