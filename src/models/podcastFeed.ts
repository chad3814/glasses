import { Episode } from '@prisma/client';
import { JSDOM } from 'jsdom';
import db, { Client } from './db';
import { XMLParser } from 'fast-xml-parser';
import { getBookshopResponse, parseBookshopBookHtml } from './bookshop';

const FEED_URL ='https://feeds.simplecast.com/SMcNunjG';

export async function getEpisodes(offset = 0, limit = 100): Promise<Episode[]> {
    return await db.$transaction(async ($tx) => {
        const res = await $tx.scrapeLog.findFirst({
            where: {
                url: FEED_URL,
            }
        });

        const sixDaysAgo = new Date();
        sixDaysAgo.setUTCDate(sixDaysAgo.getUTCDate() - 6);

        if (!res || res.lastFetch < sixDaysAgo) {
            // never fetched || maybe out of date
            await fetchFeed($tx);
        }

        const feed = await $tx.episode.findMany({
            orderBy: {
                posted: 'desc'
            },
            skip: offset,
            take: limit,
        });

        return feed;
    })
}

type ReadingGlassesFeedItem = {
    guid: {
        '@': {
            isPermaLink: boolean;
        };
        '#text': string;
    };
    title: string;
    description: string;
    pubDate: string;
    author: string;
    link: string;
    'content:encoded': string;
    enclosure: {
        '@': {
            length: string;
            type: string;
            url: string;
        };
    };
    'itunes:title': string;
    'itunes:author': string;
    'itunes:duration': string;
    'itunes:summary': string;
    'itunes:subtitle': string;
    'itunes:keywords': string;
    'itunes:explicit': boolean;
    'itunes:episodeType': string;
    'itunes:episode': number;
};

type ReadingGlassesFeed = {
    rss: {
        channel: {
            'atom:link': {
                '@': {
                    href: string;
                    rel: 'self' | 'hub';
                    title?: string;
                    type?: string;
                    xmlns?: 'http://www.w3.org/2005/Atom';
                }
            }[];
            generator: string;
            title: string;
            description: string;
            language: string;
            pubDate: string;
            lastBuildDate: string;
            image: {
                link: string;
                title: string;
                url: string;
            };
            link: string;
            'itunes:type': string;
            'itunes:summary': string;
            'itunes:author': string;
            'itunes:explicit': boolean;
            'itunes:image': {
                '@': {
                    href: string;
                };
            };
            'itunes:new-feed-url': string;
            'itunes:keywords': string;
            'itunes:owner': {
                'itunes:name': string;
                'itunes:email': string;
            };
            'itunes:category': {
                'itunes:category': {
                    '@': {
                        text: string;
                    };
                };
                '@': {
                    text: string;
                };
            }[];
            item: ReadingGlassesFeedItem[];
        };
    };
};

async function fetchFeed($tx: Client) {
    const res = await fetch(FEED_URL);

    if (!res.ok) {
        console.error('failed to fetch feed', res.status, res.statusText);
        throw new Error('failed to fetch feed');
    }

    const xml = await res.text();
    const parser = new XMLParser({
        allowBooleanAttributes: true,
        attributesGroupName: '@',
        attributeNamePrefix: '',
        ignoreAttributes: false,
        ignoreDeclaration: true,
        parseAttributeValue: true,
        processEntities: true,
    });
    const feed = parser.parse(xml) as ReadingGlassesFeed;

    const episodesRes = await $tx.episode.findMany({
        select: {
            id: true,
        }
    });

    const existingIds = episodesRes.map(r => r.id);
    const newItems = feed.rss.channel.item.filter(item => !existingIds.includes(item.guid['#text']));
    console.log('trying to add', newItems.length);
    await $tx.episode.createMany({
        data: newItems.map(item => ({
            id: item.guid['#text'],
            title: item.title,
            posted: new Date(item.pubDate),
            slug: generateSlug(item.title),
            description: item.description,
        })),
        skipDuplicates: true,
    });
    for (const episode of newItems) {
        await extractBooks($tx, episode);
    }

    await $tx.scrapeLog.upsert({
        create: {
            url: FEED_URL,
            lastFetch: new Date(),
        },
        where: {
            url: FEED_URL,
        },
        update: {
            lastFetch: new Date(),
        }
    });
}

function generateSlug(title: string): string {
    return title.toLowerCase().replaceAll(/-/gu, ' ').replaceAll(/[^a-z0-9 ]/gu, '').replaceAll(/ +/gu, '-');
}

async function extractBooks($tx: Client, episode: ReadingGlassesFeedItem): Promise<void> {
    console.log('extracting books from', episode['itunes:title'], episode.description);
    const frag = JSDOM.fragment(episode.description);
    // cooked.p.map((p: XmlP) => (p as XmlPA).a).filter((a: XmlLink) => a && a['@'].href.match(BOOK_LINK_RE));
    const bookshopTags = frag.querySelectorAll('a[href*="https://bookshop.org/"]');
    const indieBoundTags = frag.querySelectorAll('a[href*="https://www.indiebound.org/"]');
    console.log('bookshop tags:', bookshopTags.length);
    console.log('indiebound tags', indieBoundTags.length);
    for (const bookTag of [...bookshopTags, ...indieBoundTags]) {
        const bookshop = await getBookshopResponse(bookTag.getAttribute('href')!);
        if (!bookshop) {
            console.error('failed to get bookshop page:', bookTag.getAttribute('href'));
            continue;
        }

        const book = await parseBookshopBookHtml(await bookshop.text());
        if (!book) {
            console.error('failed to parse bookshop book html');
            continue;
        }

        await $tx.episode.update({
            data: {
                books: {
                    connect: {
                        id: book.id,
                    },
                },
            },
            where: {
                id: episode.guid['#text'],
            },
        });
    }
}
