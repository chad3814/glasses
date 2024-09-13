import type { NextApiRequest, NextApiResponse } from 'next'
import { getSiteMapUrls } from '../../models/bookshop'


export default async function apiGetSitemaps(req: NextApiRequest, res: NextApiResponse<string[]>) {
    const urlMods = await getSiteMapUrls();
    res.status(200).json(urlMods.map(um => um.url));
}

