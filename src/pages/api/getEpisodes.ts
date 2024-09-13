import path from 'node:path';

import type { NextApiRequest, NextApiResponse } from 'next'

import { getEpisodes } from "@/models/podcastFeed";
import { EpisodeData, episodeToEpisodeData } from '@/types/episodeData';

type Augemented = EpisodeData & {
    updateBooks: string;
};

export default async function apiGetEpisodes(req: NextApiRequest, res: NextApiResponse<Augemented[]>) {
    const offset = parseInt((req.query.offset ?? '0') as string, 10)
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit ?? '10') as string, 10)));
    const episodes = await getEpisodes(offset, limit);
    const episodeDatas = await Promise.all(
        episodes.map(episode => episodeToEpisodeData(episode))
    );
    res.status(200).json(episodeDatas.map(
        ed => ({
            ...ed,
            updateBooks: `${path.dirname(req.url ?? '')}/updateEpisodeBooks?episodeId=${ed.id}`,
        })
    ));
    return;
}
