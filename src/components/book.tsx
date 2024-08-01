// taken from https://bookshop.org/widgets.js
import { useInView } from 'react-intersection-observer';
import styles from '@/styles/book.module.css';
import { useEffect } from 'react';

type Props = {
    isbn: string | number;
    minimal?: boolean;
};

export default function Book({ isbn, minimal }: Props) {
    const { ref, inView } = useInView({
        rootMargin: "0px 0px",
        triggerOnce: true,
    });

    return <div className={styles.book} ref={ref}>
        { inView ?
            <iframe className={styles.frame} scrolling='no' src={`https://bookshop.org/widgets/book/book/4926/${isbn}`} width={minimal ? 150 : 450} height={minimal ? 420 : 268}/> :
            <div className={styles.loading} style={{
                width: minimal ? '150px' : '450px',
                height: minimal ? '420px' : '268px',
            }}/>
        }
    </div>
}