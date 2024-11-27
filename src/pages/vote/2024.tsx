import LocalBook from "@/components/localBook";
import { BookData, bookDataToBookData } from "@/types/bookData";
import { useCallback, useEffect, useState } from "react";
import styles from "@/styles/book.module.css";
import { SearchResponse } from "@/types/searchResponse";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function VotePage() {
    const router = useRouter();
    const {data: session} = useSession({
        required: true,
        onUnauthenticated: () => {
            router.push('/api/auth/signin');
        }
    });

    const [query, setQuery] = useState<string>('');
    const [books, setBooks] = useState<{book: BookData, score?: number}[]>([]);
    const [selected, setSelected] = useState<{book: BookData, score?: number}[]>([]);

    const search = useCallback(
        async (q: string) => {
            if (q === '') {
                return;
            }
            const res = await fetch(`/api/search3?q=${encodeURIComponent(q)}`);
            if (!res.ok) {
                console.error(`failed to search "${q}" ${res.status} - ${res.statusText}`);
                return;
            }

            const list = await res.json() as SearchResponse;
            setBooks(list.results.map(data => ({book: bookDataToBookData(data.book), score: data.score})));
        },
        [setBooks],
    );

    useEffect(
        () => {
            const timerId = setTimeout(() => search(query), 150);
            return () => clearTimeout(timerId);
        },
        [query, search],
    );

    const selectBook = useCallback(
        (bookId: number) => {
            const index = books.findIndex(
                data => data.book.id === bookId
            );
            if (index < 0) {
                return;
            }
            const book = books[index];
            setBooks((origBooks) => {
                const idx = origBooks.findIndex(
                    data => data.book.id === bookId
                );
                if (idx < 0) {
                    return origBooks;
                }
                origBooks.splice(idx, 1);
                return [...origBooks];
            });
            setSelected((origSelected) => [...origSelected, book]);
        },
        [books, setBooks, setSelected],
    );

    const bookList = books.map(
        ({book, score}) => {
            const datePublished: Date | null = book.datePublished ? book.datePublished as Date : null;
            if (datePublished && (
                (datePublished.getUTCFullYear() === 2023 && datePublished.getUTCMonth() === 11) ||
                (datePublished.getUTCFullYear() === 2024 && datePublished.getUTCMonth() < 11)
            )) {
                return <LocalBook book={book} minimal={true} key={book.id} onClick={selectBook} score={score} />
            }
            return <LocalBook book={book} minimal={true} key={book.id} disabled={true} title="Not published within timeframe" score={score} />
        }
    );

    const selectedBooks = selected.map(
        ({book, score}) => <LocalBook book={book} minimal={true} key={book.id} score={score} />
    );

    return <div className={styles.searchPage}>
        <div className={styles.input}>
            <h1>Search:</h1>
            <input onChange={(evt) => setQuery(evt.target.value)} value={query}/><br/>
            <div className={`${styles.searchResults} ${styles.small}`}>{bookList}</div>
        </div>
        <div className={styles.selected}>
            <h1>Selected:</h1>
            {selectedBooks}
        </div>
    </div>
}
