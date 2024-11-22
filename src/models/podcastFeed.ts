import { Episode } from '@prisma/client';
import { XMLParser } from 'fast-xml-parser';
import db, { Client } from './db';
import { getOrCreateBookByIsbn } from './book';

const FEED_URL ='https://feeds.simplecast.com/SMcNunjG';

export async function getEpisodes(offset = 0, limit = 100): Promise<Episode[]> {
    const newItems = await fetchFeed();

    const feed = await db.episode.findMany({
        orderBy: {
            posted: 'desc'
        },
        skip: offset,
        take: limit,
    });

    for (const episode of newItems) {
        extractBooks(episode);
    }

    return feed;
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

async function fetchFeed() {
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

    const newItems = await db.$transaction(
        async $tx => {
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
        return newItems;
    });

    return newItems;
}

function generateSlug(title: string): string {
    return title.toLowerCase().replaceAll(/-/gu, ' ').replaceAll(/[^a-z0-9 ]/gu, '').replaceAll(/ +/gu, '-');
}

type XmlLink = {
    '#text': string;
    '@': {
        href: string;
    }
};
type XmlPA = {
    a: XmlLink;
};
type XmlP = string | XmlPA;

function getAnchorTags(xml: any): XmlLink[] {
    const anchors: XmlLink[] = [];
    if (Array.isArray(xml)) {
        for (const i of xml) {
            anchors.push(...getAnchorTags(i));
        }
        return anchors;
    }
    if ('object' === typeof xml) {
        for (const k of Object.keys(xml)) {
            if (k === 'a') {
                if (Array.isArray(xml.a)) {
                    anchors.push(...xml.a);
                } else {
                    anchors.push(xml.a);
                }
            } else {
                anchors.push(...getAnchorTags(xml[k]));
            }
        }
    }

    return anchors;
}

const BOOK_LINK_RE = /^https:\/\/((bookshop.org\/a\/4926)|(www.indiebound.org\/book))\/(?<isbn>[0-9]{13})$/u;

async function extractBooks(episode: ReadingGlassesFeedItem): Promise<void> {
    const parser = new XMLParser({
        allowBooleanAttributes: true,
        attributesGroupName: '@',
        attributeNamePrefix: '',
        ignoreAttributes: false,
        ignoreDeclaration: true,
        parseAttributeValue: true,
        processEntities: true,
        htmlEntities: true,
    });
    const cooked = parser.parse(episode.description);
    const bookTags = getAnchorTags(cooked);
    for (const bookTag of bookTags) {
        const isbnMatch: RegExpMatchArray | null = bookTag['@'].href.match(BOOK_LINK_RE);
        if (!isbnMatch) {
            console.error('no isbn match for', bookTag['@'].href);
            continue;
        }

        await db.$transaction(
            async $tx => {
                const book = await getOrCreateBookByIsbn(isbnMatch.groups!.isbn, $tx);
                if (!book) {
                    return;
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
        );
    }
}
