import { Episode } from "@prisma/client";
import db from "@/models/db";

export type EpisodeData = Omit<Episode, 'posted'> & {
    posted: number;
    workIds: number[];
};

export async function episodeToEpisodeData(episode: Episode, $tx = db): Promise<EpisodeData> {
    const workIds = await $tx.work.findMany({
        select: {
            id: true,
        },
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
            workIds: workIds.map(work => work.id),
        },
    );
    return ret;
}

export function episodeDataToEpisode(episodeData: EpisodeData): Episode {
    const ret = Object.assign({}, episodeData, {posted: new Date(episodeData.posted)});
    return ret;
}
