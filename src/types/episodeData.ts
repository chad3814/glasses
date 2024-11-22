import { Episode } from "@prisma/client";
import { BookData, bookDataToBookData, bookToBookData } from "./bookData";
import db from "@/models/db";

export type EpisodeData = Omit<Episode, 'posted'> & {
    posted: number | Date;
    books: BookData[];
};

export async function episodeToEpisodeData(episode: Episode, $tx = db): Promise<EpisodeData> {
    const books = await $tx.book.findMany({
        where: {
            episodes: {
                some: {
                    id: episode.id,
                },
            },
        },
    });

    const ret = Object.assign(
        {},
        episode,
        {
            posted: episode.posted.getTime(),
            books: await Promise.all(books.map(book => bookToBookData(book, $tx))),
        },
    );
    return ret;
}

export function episodeDataToEpisodeData(episodeData: EpisodeData): EpisodeData {
    const ret = Object.assign({}, episodeData, {
        posted: new Date(episodeData.posted),
        books: episodeData.books.map(
            book => bookDataToBookData(book)
        ),
    });
    return ret;
}
