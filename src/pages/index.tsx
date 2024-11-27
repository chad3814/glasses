import Head from "next/head";
import styles from "@/styles/index.module.css";
import Link from "next/link";

export default function Home() {
    return (
        <>
            <Head>
                <title>Reading Glasses Db</title>
                <meta name="description" content="A specialized database for Reading Glasses listeners" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/rg-logo.png" />
            </Head>
            <main className={styles.main}>
                <h1 className={styles.h1}><Link href="/top100">Top 100 Books of the Century (So Far)</Link></h1>
                <h1 className={styles.h1}><Link href="/vote/2024">Vote for Top 10 of 2024</Link></h1>
            </main>
        </>
    );
}