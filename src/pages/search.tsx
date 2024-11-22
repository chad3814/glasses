import LocalBook from "@/components/localBook";
import { BookData } from "@/types/bookData";
import { useCallback, useEffect, useState } from "react";
import styles from "@/styles/book.module.css";

export default function SearchPage() {
    const [query, setQuery] = useState<string>('');
    const [books, setBooks] = useState<BookData[]>([]);

    const search = useCallback(
        async (q: string) => {
            if (q === '') {
                return;
            }
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            if (!res.ok) {
                console.error(`failed to search "${q}" ${res.status} - ${res.statusText}`);
                return;
            }

            const list = await res.json() as BookData[];
            setBooks(list);
        },
        [setBooks],
    );

    useEffect(
        () => {
            const timerId = setTimeout(() => search(query), 750);
            return () => clearTimeout(timerId);
        },
        [query, search],
    );

    const bookList = books.map(
        book => <LocalBook book={book} minimal={true} key={book.id}/>
    );

    return <div>
        <input onChange={(evt) => setQuery(evt.target.value)} value={query}/><br/>
        <div className={`${styles.searchResults} ${styles.small}`}>{bookList}</div>
    </div>
}
