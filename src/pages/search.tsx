import LocalBook from "@/components/localBook";
import { BookData, bookDataToBookData } from "@/types/bookData";
import { useCallback, useEffect, useState } from "react";
import styles from "@/styles/book.module.css";

export default function SearchPage() {
    const [query, setQuery] = useState<string>('');
    const [books, setBooks] = useState<BookData[]>([]);
    const [selected, setSelected] = useState<BookData[]>([]);

    const search = useCallback(
        async (q: string) => {
            if (q === '') {
                return;
            }
            const res = await fetch(`/api/search2?q=${encodeURIComponent(q)}`);
            if (!res.ok) {
                console.error(`failed to search "${q}" ${res.status} - ${res.statusText}`);
                return;
            }

            const list = await res.json() as BookData[];
            setBooks(list.map(bookDataToBookData));
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

    const selectBook = useCallback(
        (bookId: number) => {
            const index = books.findIndex(
                book => book.id === bookId
            );
            if (index < 0) {
                return;
            }
            const book = books[index];
            setBooks((origBooks: BookData[]) => {
                const idx = origBooks.findIndex(
                    book => book.id === bookId
                );
                if (idx < 0) {
                    return origBooks;
                }
                origBooks.splice(idx, 1);
                return [...origBooks];
            });
            setSelected((origSelected: BookData[]) => [...origSelected, book]);
        },
        [books, setBooks, setSelected],
    );

    const bookList = books.map(
        book => {
            const datePublished: Date | null = book.datePublished ? book.datePublished as Date : null;
            if (datePublished && (
                (datePublished.getUTCFullYear() === 2023 && datePublished.getUTCMonth() === 11) ||
                (datePublished.getUTCFullYear() === 2024 && datePublished.getUTCMonth() < 11)
            )) {
                return <LocalBook book={book} minimal={true} key={book.id} onClick={selectBook}/>
            }
            return <LocalBook book={book} minimal={true} key={book.id} disabled={true} title="Not published within timeframe"/>
        }
    );

    const selectedBooks = selected.map(
        book => <LocalBook book={book} minimal={true} key={book.id}/>
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
