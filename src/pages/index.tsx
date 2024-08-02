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

export default function Home() {
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
      </main>
    </>
  );
}
