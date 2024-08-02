import {createReadStream, promises} from 'node:fs';
import { parse } from 'csv-parse';

type Book = {
    isbn: number;
    title: string;
    author: string;
    rank: number;
    votes: number;
};

async function main() {
    const file = process.argv[2];
    const stream = createReadStream(file);
    const parser = stream.pipe(parse());
    const books: Book[] = [];
    let rank = 1;
    for await (const record of parser) {
        const [votes, isbn, title, author] = record;
        books.push({
            isbn: parseInt(isbn, 10),
            title,
            author,
            rank,
            votes: parseInt(votes, 10),
        });
        rank++;
    }
    await promises.writeFile('rankedBooks.json', JSON.stringify(books));
}

main();
