import { BookData } from "./bookData";

export type SearchResponse = {
    results: {
        book: BookData;
        score?: number;
    }[];
}
