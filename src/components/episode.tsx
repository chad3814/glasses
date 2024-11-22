import { EpisodeData, episodeDataToEpisodeData } from "@/types/episodeData";
import Link from "next/link";
import styles from '@/styles/episode.module.css';
import Book from "./book";

type Props = {
    episodeData: EpisodeData;
};

export default function Episode({episodeData}: Props) {
    const episode = episodeDataToEpisodeData(episodeData);

    return <div className={styles.episode}>
        <div className={styles.title}><Link href={`https://maximumfun.org/episodes/reading-glasses/${episode.slug}/`}>{episode.title}</Link></div>
        <div className={styles.posted}>{(episode.posted as Date).toISOString()}</div>
        { episodeData.books.map(book => <Book key={book.isbn13} isbn={book.isbn13} />)}
    </div>
}
