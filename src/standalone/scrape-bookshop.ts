import { queue } from 'async';
import { JSDOM } from 'jsdom';

import { BOOKSHOP_UA, CLOUDFLARE_RE, getSiteMapUrls, getUrlSetUrls, UrlMod } from '../models/bookshop';
import { Book, Format } from '@prisma/client';
import db from '../models/db';
import { getOrCreateAuthor, getOrCreateBook, getOrCreateWork } from '../models/book';
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
        const headers = new Headers();
        headers.set('User-Agent', BOOKSHOP_UA);
        if (etag) {
            headers.set('If-None-Match', etag);
        }
        const response = await fetch(url, { headers });
        if (!response.ok) {
            if (response.status === 403) {
                const body = await response.text();
                const match = body.match(CLOUDFLARE_RE);
                if (match) {

                }
            }
            if (response.status === 304) {
                return null;
            }
            throw new Error(`${response.status} ${response.statusText}`);
        }
        const responseEtag = response.headers.get('etag');
        let frag: ReturnType<typeof JSDOM.fragment>;
        try {
            frag = JSDOM.fragment(await response.text());
        } catch (err) {
            console.error('jsdom error', err);
            return null;
        }
        const typeNode = frag.querySelector('meta[property="og:type"]');
        if (!typeNode || typeNode.getAttribute('content') !== 'book') {
            console.error(url, 'not a book');
            return null;
        }
        const isbn = frag.querySelector('meta[property="book:isbn"]')?.getAttribute('content');
        if (!isbn) {
            console.error(url, 'no isbn');
            return null;
        }
        const titleNode = frag.querySelector('meta[property="og:title"]');
        let title = '';
        let authorName = '';
        if (titleNode && titleNode.hasAttribute('content')) {
            const titleAuthor = titleNode.getAttribute('content')!;
            console.log(titleAuthor);
            [title, authorName] = titleAuthor.split(' a book by ');
        }
        const releaseDate = new Date(frag.querySelector('meta[property="book:release_date"]')?.getAttribute('content') ?? 0);
        const description = frag.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? undefined;
        const authorBsUrl = frag.querySelector('meta[property="book:author"]')?.getAttribute('content') ?? undefined;
        const imageUrl = frag.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? undefined;
        const format = frag.querySelector('div[itemprop="bookFormat"]')?.textContent;
        const pages = Number(frag.querySelector('div[itemprop="numberOfPages"]')?.textContent ?? -1);
        const book = await db.$transaction(
            async $tx => {
                const a = await getOrCreateAuthor($tx, authorName, authorBsUrl);
                const w = await getOrCreateWork($tx, title, a);
                await $tx.work.update({
                    data: {
                        description,
                    },
                    where: {
                        id: w.id,
                    }
                });
                let f: Format = Format.hardcover;
                switch (format) {
                    default:
                    case 'Hardcover':
                        f = Format.hardcover;
                        break;
                    case 'Trade Paperback':
                    case 'Paperback':
                        f = Format.paperback;
                        break;
                    case 'Compact Disc':
                        f = Format.audio;
                        break;
                }
                const {id} = await getOrCreateBook($tx, w, isbn, f);
                const b = await $tx.book.update({
                    data: {
                        releaseDate,
                        pages,
                        imageUrl,
                    },
                    where: {
                        id,
                    }
                });

                await $tx.scrapeLog.upsert({
                    create: {
                        url,
                        etag: responseEtag,
                        lastFetch: new Date(),
                    },
                    update: {
                        etag: responseEtag,
                        lastFetch: new Date(),
                    },
                    where: {
                        url,
                    }
                });

                return b;
            }
        );

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