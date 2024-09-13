import type { NextApiRequest, NextApiResponse } from 'next'
import { getUrlSetUrls, UrlMod } from '../../models/bookshop'
import db from '../../models/db';


export default async function apiGetBookUrls(req: NextApiRequest, res: NextApiResponse<string[]>) {
    const url = req.body.url;
    try {
        const urlMods = await getUrlSetUrls(url);
        const ret = new Map<string, UrlMod>();
        for (const urlMod of urlMods) {
            ret.set(urlMod.url, urlMod);
        }
        const existing = await db.scrapeLog.findMany({
            where: {
                url: {
                    in: [...urlMods].map(u => u.url)
                }
            }
        });
        for (const exist of existing) {
            const urlMod = ret.get(exist.url)!;
            if (urlMod.lastmod <= exist.lastFetch) {
                ret.delete(exist.url);
            }
        }
        res.status(200).json([...ret.keys()]);
    } catch (err) {
        res.status(500).json(['error']);
    }
}

