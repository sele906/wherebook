import { bookMeta, shortTitle } from './routeBooks';
import styles from './page.module.css';

// 책 한 줄: [제목 (넘치면 말줄임)] [출판사 연도 (줄어들지 않음)]. 저자는 넣지 않는다
export default function BookLine({ book }) {
    const meta = bookMeta(book);

    return (
        <span className={styles.bookLine}>
            <span className={styles.bookTitle}>{shortTitle(book)}</span>
            {meta && <span className={styles.bookMeta}>{meta}</span>}
        </span>
    );
}
