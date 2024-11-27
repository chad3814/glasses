import db from "./src/models/db";
import { take } from "./src/utils/take";
import { tokenize } from "./src/utils/tokenize";
import { Prisma } from "@prisma/client";

async function main() {
    const count = await db.book.count();

    console.log('count:', count);
    if (!count) {
        throw new Error('failed to get maxId');
    }

    const batchSize = 1000;
    const batchCount = Math.ceil(count / batchSize);
    console.log('batchCount:', batchCount);
    for (let i = 0; i < batchCount; i++) {
        const books = await db.book.findMany({
            select: {
                id: true,
                title: true,
                longTitle: true,
                overview: true,
                authors: {
                    include: {
                        author: {
                            select: {
                                name: true,
                            }
                        }
                    },
                },
            },
            orderBy: {
                id: 'asc'
            },
            take: 1000,
            skip: i * batchSize,
        });
        console.log('got', books.length, 'on', i, 'round');
        const datas: Prisma.WordSearchCreateManyInput[] = [];
        for (const book of books) {
            const title = tokenize(`${book.title.toLowerCase()} ${book.longTitle?.toLowerCase() ?? ''}`).filter(
                token => token !== ''
            );
            const authors = tokenize(book.authors.map(authorBook => authorBook.author.name.toLowerCase()).reduce((c, n) => c + ' ' + n, '')).filter(
                token => token !== ''
            );
            const overview = tokenize(book.overview?.toLowerCase() ?? '').filter(
                token => token !== ''
            );
            datas.push(
                ...title.map(
                    word => ({word, bookId: book.id, score: 10}),
                ),
                ...authors.map(
                    word => ({word, bookId: book.id, score: 5}),
                ),
                ...overview.map(
                    word => ({word, bookId: book.id, score: 1}),
                ),
            );
        }
        console.log('data is', datas.length, 'on', i, 'round');
        for (const data of take(1000, datas)) {
            await db.wordSearch.createMany({
                data,
                skipDuplicates: true,
            });
        }
    }
}

main();