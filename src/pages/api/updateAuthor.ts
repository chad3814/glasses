import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/models/db';
import { ErrorResponse } from '@/types/errorResponse';
import { Author } from '@prisma/client';
import { AuthorData } from '@/types/authorData';

export default async function apiUpdateAuthor(req: NextApiRequest, res: NextApiResponse<number|ErrorResponse>) {
    if (req.method !== 'POST') {
        res.status(404).json({error: 'bad method'});
        return;
    }

    const authorData: AuthorData = JSON.parse(req.body);
    const author = await db.author.update({
        data: {
            name: authorData.name,
            sortName: authorData.sortName,
        },
        where: {
            id: authorData.id,
        }
    });
    if (authorData.alternateNames && authorData.alternateNames.length > 0) {
        await db.alternateName.createMany({
            data: authorData.alternateNames.map(alternameName => ({
                authorId: authorData.id,
                name: alternameName,
            })),
            skipDuplicates: true,
        });
    }

    res.status(200).json(author.id);
}
