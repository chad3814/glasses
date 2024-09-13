import type { NextApiRequest, NextApiResponse } from 'next'

import { extractBooks } from "@/models/podcastFeed";
import db from '@/models/db';

export default async function apiUpdateEpisodeBooks(req: NextApiRequest, res: NextApiResponse<boolean>) {
    const episodeId = req.query.episodeId as string;
    if (!episodeId) {
        res.status(400).json(false);
        return;
    }
    const episode = await db.episode.findFirst({
        where: {
            id: episodeId,
        }
    });

    if (!episode) {
        res.status(404).json(false);
        return;
    }

    await extractBooks(episode);

    res.status(200).json(true);

    return;
}
