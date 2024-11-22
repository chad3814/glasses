import styles from '@/styles/book.module.css';
import { BookData } from '@/types/bookData';
import Image from 'next/image';

type Props = {
    book: BookData;
    minimal?: boolean;
    disabled?: boolean;
    onClick?: (bookId: number) => void;
    title?: string;
};

export default function LocalBook({ book, disabled, minimal, onClick, title }: Props) {
    const authors = book.authors.map(
        (author, idx) => <span key={author.id}>{author.name}{idx < (book.authors.length - 1) ? ', ' : ''}</span>
    );

    onClick = onClick ?? (() => { });

    return <div className={`${styles.localBook} ${disabled ? styles.disabled : styles.clickable}`} onClick={() => onClick(book.id)} data-book-id={book.id} title={title}>
        {book.coverImage ? <Image className={styles.coverImage} src={book.coverImage} width={50} height={75} alt={book.longTitle ?? book.title}/> : <div className={styles.coverImage}>No Image</div>}
        <div className={styles.info}>
            {minimal ? <><h3 className={styles.title}>{book.title}</h3><h6>by {authors}</h6></> :
                <>
                    <h1 className={styles.title}>{book.longTitle ?? book.title}</h1>
                    <h4>by {authors}</h4>
                    <div className={styles.overview}>{book.overview}</div>
                </>
            }
        </div>
    </div>
}