import styles from "@/styles/rankedRow.module.css";
import RankedBook from "./rankedBook";

type Props = {
    books: {
        isbn: number;
        title: string;
        author: string;
        rank: number;
        votes: number;
        overdriveId?: string;
    }[];
};

export default function RankedRow({ books }: Props) {
    return <div className={styles.row}>{books.map(
        book =>
            <RankedBook
                key={book.isbn}
                isbn={book.isbn}
                title={book.title}
                author={book.author}
                rank={book.rank}
                votes={book.votes}
                overdriveId={book.overdriveId}
            />
    )}</div>
}
