import { NextApiRequest, NextApiResponse } from "next";
import { ErrorResponse } from '@/types/errorResponse';
import db from '@/models/db';

type AuthorQueryResponse = {
    id: number;
    name: string;
}

export default async function apiQueryAuthors(req: NextApiRequest, res: NextApiResponse<AuthorQueryResponse[]|ErrorResponse>) {
    if (!req.query.q || Array.isArray(req.query.q) || req.query.q === '') {
        res.status(501).json({error: 'bad query'});
    }

    const q = req.query.q as string;
    const [authors, alts] = await Promise.all([
        db.author.findMany({
            select: {
                id: true,
                name: true,
            },
            where: {
                name: {
                    contains: q,
                },
            }
        }),
        db.alternateName.findMany({
            select: {
                authorId: true,
                name: true,
            },
            where: {
                name: {
                    contains: q,
                },
            },
        }),
    ]);

    for (const alt of alts) {
        authors.push({
            id: alt.authorId,
            name: alt.name,
        });
    }

    res.status(200).json(authors);
}
