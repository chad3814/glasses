/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import styles from "@/styles/rankedBook.module.css";

type Props = {
    isbn: number;
    title: string;
    author: string;
    rank: number;
    votes: number;
}
export default function RankedBook({
    isbn,
    title,
    author,
    rank,
    votes,
}: Props) {
    return <div className={styles.rankedBook}>
        <div className={styles.rank}>{rank}</div>
        <div className={styles.book}>
            <img
                src={`https://images-us.bookshop.org/ingram/${isbn}.jpg?height=250&v=v2.jpg`}
                loading="lazy"
                alt={`${title} by ${author}`}
                height={125}
            />
            <div className={styles.text}>
                <div className={styles.title}>{title}</div>
                <div className={styles.author}>{author}</div>
                <div className={styles.votes}>{votes} votes</div>
                <div className={styles.links}>
                    <a href={`https://bookshop.org/a/4926/${isbn}`} target="_blank" title="Buy a copy from Bookshop.org">Bookshop.org</a>
                    <a href={``} target="_blank" title="Borrow a copy using Overdrive">Overdrive</a>
                </div>
            </div>
        </div>
    </div>
}