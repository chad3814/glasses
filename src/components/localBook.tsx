import styles from '@/styles/book.module.css';
import { BookData } from '@/types/bookData';
import Image from 'next/image';

type Props = {
    book: BookData;
    minimal?: boolean;
};

export default function LocalBook({ book, minimal }: Props) {
    const authors = book.authors.map(
        (author, idx) => <span key={author.id}>{author.name}{idx < (book.authors.length - 1) ? ', ' : ''}</span>
    );

    return <div className={styles.localBook} data-book-id={book.id}>
        {book.coverImage ? <Image className={styles.coverImage} src={book.coverImage} width={50} height={75} alt={book.longTitle ?? book.title}/> : <div className={styles.coverImage}>No Image</div>}
        <div className={styles.info}>
            {minimal ? <><h3>{book.title}</h3><h6>by {authors}</h6></> :
                <>
                    <h1>{book.longTitle ?? book.title}</h1>
                    <h4>by {authors}</h4>
                    <div className={styles.overview}>{book.overview}</div>
                </>
            }
        </div>
    </div>
}