import { Author, Episode, Format, Work } from '@prisma/client';
import { XMLParser } from 'fast-xml-parser';
import db, { Client } from './db';

export async function getEpisodes(offset = 0, limit = 100): Promise<Episode[]> {
    return await db.$transaction(async ($tx) => {
        const res = await $tx.metadata.findFirst({
            orderBy: {
                id: 'desc'
            }
        });

        const sixDaysAgo = new Date();
        sixDaysAgo.setUTCDate(sixDaysAgo.getUTCDate() - 6);

        if (!res || res.lastFeedFetch < sixDaysAgo) {
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
    const res = await fetch('https://feeds.simplecast.com/SMcNunjG');

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

    await $tx.metadata.create({
        data: {
            lastFeedFetch: new Date(),
        }
    });

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

const BOOK_LINK_RE = /^https:\/\/bookshop.org\/a\/4926\/[0-9](?<isbn>[0-9]{13})$/u;
const BOOK_TITLE_AUTHOR_RE = /^(?<title>.*) by (?<author>.*)$/u;

async function extractBooks($tx: Client, episode: ReadingGlassesFeedItem): Promise<void> {
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
    const bookTags = cooked.p.map((p: XmlP) => (p as XmlPA).a).filter((a: XmlLink) => a && a['@'].href.match(BOOK_LINK_RE));

    for (const bookTag of bookTags) {
        let matches: RegExpMatchArray | null = bookTag['#text'].match(BOOK_TITLE_AUTHOR_RE);
        if (!matches) {
            console.error('no title/author match for', bookTag['#text']);
            continue;
        }
        const isbnMatch: RegExpMatchArray | null = bookTag['@'].href.match(BOOK_LINK_RE);
        if (!isbnMatch) {
            console.error('no isbn match for', bookTag['@'].href);
            continue;
        }
        const author = await getOrCreateAuthor($tx, matches.groups!.author);
        const work = await getOrCreateWork($tx, matches.groups!.title, author);
        await getOrCreateBook($tx, work, parseInt(isbnMatch.groups!.isbn, 10));
        await $tx.episode.update({
            data: {
                works: {
                    connect: {
                        id: work.id,
                    },
                },
            },
            where: {
                id: episode.guid['#text'],
            },
        });
    }
}

async function getOrCreateAuthor($tx: Client, name: string) {
    let author = await $tx.author.findFirst({
        where: {
            name,
        },
    });

    if (author) {
        return author;
    }

    author = await $tx.author.create({
        data: {
            name,
        },
    });
    return author;
}

async function getOrCreateWork($tx: Client, title: string, author: Author) {
    let work = await $tx.work.findFirst({
        where: {
            title,
            authorId: author.id,
        },
    });

    if (work) {
        return work;
    }

    work = await $tx.work.create({
        data: {
            title,
            authorId: author.id,
        },
    });
    return work;
}

async function getOrCreateBook($tx: Client, work: Work, isbn: number, format = Format.hardcover) {
    let book = await $tx.book.findFirst({
        where: {
            isbn,
        },
    });

    if (book) {
        return book;
    }

    book = await $tx.book.create({
        data: {
            isbn,
            workId: work.id,
            format,
        },
    });
    return book;
}
