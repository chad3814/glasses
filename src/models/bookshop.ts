import { XMLParser } from 'fast-xml-parser';
import { JSDOM } from 'jsdom';
import { gunzip as gz} from 'node:zlib';
import { promisify } from 'node:util';
import db from './db';
import { take } from '../utils/take';
import { sleep } from '../utils/sleep';
import { Book, Format } from '@prisma/client';
import { getOrCreateBook } from './book';
const gunzip = promisify(gz);

const SITEMAP_URL = 'https://bookshop.org/sitemap.xml.gz';
const ROBOTS_URL = 'https://bookshop.org/robots.txt';

export type Loc = {
    loc: string;
    lastmod: string;
}

export type Sitemap = Loc & {
}

export type SitemapIndex = {
    sitemap: Sitemap[];
}

export type UrlSetUrl = Loc & {
    changefreq: 'weekly';
    proiority: number;
}

export type UrlSet = {
    url: UrlSetUrl[];
}

export type UrlMod = {
    url: string;
    lastmod: Date;
}

function parseLoc(loc: Loc): UrlMod {
    return {
        url: loc.loc,
        lastmod: new Date(loc.lastmod),
    }
}

export async function parseBookshopBookHtml(html: string): Promise<Book | null> {
    let frag: ReturnType<typeof JSDOM.fragment>;
    try {
        frag = JSDOM.fragment(html);
    } catch (err) {
        console.error('jsdom error', err);
        return null;
    }
    const typeNode = frag.querySelector('meta[property="og:type"]');
    if (!typeNode || typeNode.getAttribute('content') !== 'book') {
        console.error('not a book');
        return null;
    }
    const isbn = frag.querySelector('meta[property="book:isbn"]')?.getAttribute('content');
    if (!isbn) {
        console.error('no isbn');
        return null;
    }
    const titleNode = frag.querySelector('meta[property="og:title"]');
    let title = '';
    let authorName = '';
    if (titleNode && titleNode.hasAttribute('content')) {
        const titleAuthor = titleNode.getAttribute('content')!;
        // console.log(titleAuthor);
        [title, authorName] = titleAuthor.split(' a book by ');
    }
    const releaseDate = new Date(frag.querySelector('meta[property="book:release_date"]')?.getAttribute('content') ?? 0);
    const description = frag.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? undefined;
    const authorBsUrl = frag.querySelector('meta[property="book:author"]')?.getAttribute('content') ?? undefined;
    const imageUrl = frag.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? undefined;
    const format = frag.querySelector('div[itemprop="bookFormat"]')?.textContent;
    const pages = Number(frag.querySelector('div[itemprop="numberOfPages"]')?.textContent ?? -1);
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

    const book = await getOrCreateBook(
        db,
        isbn,
        authorName,
        title,
        description,
        imageUrl,
        authorBsUrl,
        pages,
        f,
        releaseDate,
    );

    return book;
}

export const BOOKSHOP_UA = 'ReadingGlassesDb/1.0 (Chad Walker chad@cwalker.dev)';

// cloud flare rate limiting
export const CLOUDFLARE_RE = /history.replaceState\(null, null, "\\\/[^?]+\?(?<key>__cf[a-z_]+=[^"]+)"/u;

export async function getBookshopResponse(url: string, etag?: string): Promise<Response | null> {
    console.log('get bookshop:', url);
    let response: Response;
    const headers = new Headers();
    headers.set('User-Agent', BOOKSHOP_UA);

    if (etag) {
        headers.set('If-None-Match', etag);
    }

    try {
        response = await fetch(url, {
            headers,
        });
    } catch (err) {
        console.error('fetch failed, sleeping');
        await sleep(2000);
        return getBookshopResponse(url, etag);
    }
    if (!response.ok) {
        if (response.status === 403) {
            console.error(url, '403');
            const body = await response.text();
            const match = body.match(CLOUDFLARE_RE);
            if (match && match.groups?.key) {
                const u = new URL(url);
                const key = match.groups.key;
                u.search = key;
                console.error('key', key, u.href);
                return getBookshopResponse(u.href, etag);
            }
        } else if (response.status === 304) {
            return null;
        }
        console.error(url, response.status, response.statusText);
        throw new Error('failed to get bookshop data');
    }
    return response;
}

async function getGzXml<T>(url: string, etag?: string): Promise<{dom: T, etag: string | null} | null> {
    const response = await getBookshopResponse(url, etag);
    if (!response) {
        return null;
    }
    const responseEtag = response.headers.get('etag');
    const xml = await gunzip(await response.arrayBuffer());
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributesGroupName: '@',
        attributeNamePrefix: '',
        ignoreDeclaration: true,
        ignorePiTags: true,
        parseAttributeValue: true,
        processEntities: true,
    });
    const dom = parser.parse(xml) as T;
    return {dom, etag: responseEtag}
}

export async function getSiteMapUrls(): Promise<UrlMod[]> {
    const response = await getGzXml<{sitemapindex: SitemapIndex}>(SITEMAP_URL);
    if (!response) {
        console.error('failed to the main sitemap');
        throw new Error('failed to get sitemapindex');
    }
    return response.dom.sitemapindex.sitemap.map(
        sitemap => parseLoc(sitemap)
    );
}

export async function getUrlSetUrls(sitemapUrl: string): Promise<IterableIterator<UrlMod>> {
    const scrape = await db.scrapeLog.findFirst({
        where: {
            url: sitemapUrl,
        },
    });
    const response = await getGzXml<{urlset: UrlSet}>(sitemapUrl, scrape?.etag ?? undefined);
    if (!response) {
        return [].values();
    }
    const {dom, etag} = response;
    await db.scrapeLog.upsert({
        where: {
            url: sitemapUrl,
        },
        create: {
            url: sitemapUrl,
            lastFetch: new Date(),
            etag,
        },
        update: {
            etag,
            lastFetch: new Date(),
        },
    });
    const locs = dom.urlset.url.map(u => parseLoc(u));
    const ret = new Map<string, UrlMod>();
    for (const loc of locs) {
        ret.set(loc.url, loc);
    }
    for (const urls of take(100, ret.keys())) {
        const existing = await db.scrapeLog.findMany({
            where: {
                url: {
                    in: urls
                }
            }
        });

        for (const exists of existing) {
            const loc = ret.get(exists.url);
            if (loc!.lastmod <= exists.lastFetch) {
                ret.delete(exists.url);
            }
        }
    }
    console.log(sitemapUrl, ret.size);
    return ret.values();
}
