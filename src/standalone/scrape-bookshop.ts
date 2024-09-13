import { queue } from 'async';
import { getBookshopResponse, getSiteMapUrls, getUrlSetUrls, parseBookshopBookHtml } from '../models/bookshop';
import { Book } from '@prisma/client';
import db from '../models/db';
import { sleep } from '../utils/sleep';
import { take } from '../utils/take';

const MIN_TIME_MS = 200;

type WorkerItem = {
    url: string;
    etag?: string;
};

async function bookWorker({url, etag}: WorkerItem): Promise<Book | null>  {
    const doneMs = Date.now() + MIN_TIME_MS;
    try {
        const response = await getBookshopResponse(url, etag);
        if (!response) {
            return null;
        }

        const responseEtag = response.headers.get('etag');
        const book = await parseBookshopBookHtml(await response.text());
        if (book) {
            await db.scrapeLog.upsert({
                where: {
                    url,
                },
                create: {
                    url,
                    etag: responseEtag,
                    lastFetch: new Date(),
                },
                update: {
                    etag: responseEtag,
                    lastFetch: new Date(),
                }
            });
        }
        return book;
    } finally {
        const waitTimeMs = doneMs - Date.now();
        if (waitTimeMs > 0) {
            await sleep(waitTimeMs);
        }
    }
}

const BOOKSHOP_BOOK_URL_RE = /^https:\/\/bookshop.org\/p\/books\//u;

async function main() {
    const siteMaps = await getSiteMapUrls();
    const q = queue(bookWorker, 5);
    const int = setInterval(() => console.log('queued:', q.length()), 2000);

    for (const siteMap of siteMaps) {
        const urls = await getUrlSetUrls(siteMap.url);
        const etags = new Map<string, string>();
        for (const urlSet of take(100, urls)) {
            const results = await db.scrapeLog.findMany({
                where: {
                    url: {
                        in: urlSet.map(u => u.url),
                    }
                }
            });
            for (const result of results) {
                if (result.etag) {
                    etags.set(result.url, result.etag);
                }
            }
        }
        for (const u of urls) {
            if (u.url.match(BOOKSHOP_BOOK_URL_RE)) {
                q.push({url: u.url, etag: etags.get(u.url)});
            }
        }
    }
    await q.drain();
    clearInterval(int);
}

main();