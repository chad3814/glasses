import Head from "next/head";
import styles from "@/styles/top100.module.css";
import books from "./books.json";
import RankedRow from "@/components/rankedRow";

type BookData = {
  isbn: number;
  title: string;
  author: string;
  rank: number;
  votes: number;
  overdriveId: string;
};

export default function Top100() {
  const rows = [];
  for(let i = 99; i >= 0; i--) {
    rows.push(
      <RankedRow key={`row${i/2}`} books={[books[i]]} />
    );
  }
  return (
    <>
      <Head>
        <title>Glasser Top 100 Books of the Century (So Far)</title>
        <meta name="description" content="The top 100 books as voted on by Reading Glasses listeners" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/rg-logo.png" />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.h1}>Glasser Top 100 Books of the Century (So Far)</h1>
        {rows}
        <span className={styles.challenge}>
          Glasser Jay created this&nbsp;
          <a href="https://app.thestorygraph.com/reading_challenges/04b5ddbd-c658-44c7-873c-b0f4d7566999?redirect=true" title="A StoryGraph challenge" target="_blank">StoryGraph Challenge</a>
          &nbsp;to go along with the list!
        </span>
        <div className={styles.github}>
          <a href="https://github.com/chad3814/glasses" title="This site on github">View on Github <svg viewBox="0 0 16 16" width="16" height="16"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path></svg></a>
        </div>
      </main>
    </>
  );
}
