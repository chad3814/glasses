import { parse } from "csv-parse";
import { NextApiRequest, NextApiResponse } from "next";
import { createReadStream } from "node:fs";
import { addWork } from "@/utils/addWork";


export default async function apiConvert(req: NextApiRequest, res: NextApiResponse) {
    const file = '/home/chad/Projects/top-books/src/pages/api/top100.csv';
    const stream = createReadStream(file);
    const parser = stream.pipe(parse());

    for await (const record of parser) {
        const [votes, isbnStr, title, authorStr] = record;
        const isbn = parseInt(isbnStr, 10);
        const authorNames: string[] = authorStr.split(' & ');
        await addWork(title, authorNames, isbn);
   }
    res.status(200).json({ok: 'ok'});
}