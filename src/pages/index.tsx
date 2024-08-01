import { EpisodeData } from "@/types/episodeData";
import Head from "next/head";
import { useEffect, useState } from "react";

import styles from '@/styles/index.module.css';
import Episode from "@/components/episode";

export default function Home() {
  const [episodes, setEpisodes] = useState<EpisodeData[]>([]);

  useEffect(
    () => {
      (async() => {
        const res = await fetch('/api/getEpisodes');
        setEpisodes(await res.json());
      })();
      return () => setEpisodes([]);
    },
    [setEpisodes],
  )

  return (
    <>
      <Head>
        <title>Reading Glasses Recommended Books</title>
        <meta name="description" content="All the books recommended from the podcast Reading Glasses" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        {episodes.map(
          episode => <Episode key={episode.id} episodeData={episode}/>
        )}
      </main>
    </>
  );
}
