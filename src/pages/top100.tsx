import Head from "next/head";
import styles from "@/styles/top100.module.css";
import Book from "@/components/book";
import isbns from "./isbns.json";

export default function Home() {
  // const isbns = [
  //   9781571313560,
  //   9781534430990,
  //   9781250236210,
  //   9780316556347,
  //   9781101947135,
  //   9780316229296,
  //   9780062444134,
  //   9780063021426,
  //   9780593536551,
  //   9781250856036,
  //   9780385353304,
  //   9780593321201,
  //   9780062059888,
  //   9780374104092,
  //   9780307588364,
  //   9781594748622,
  //   9781635575637,
  //   9780593135204,
  //   9780063204157,
  //   9781982150921,
  //   9780062060617,
  //   9781250214713,
  //   9781432879716,
  //   9780063251984,
  //   9780593133378,
  //   9780593500132,
  //   9781573229722,
  //   9780374602109,
  //   9781644450383,
  //   9780735223721,
  //   9780380813810,
  //   9781250886088,
  //   9781250789068,
  //   9780525562023,
  //   9780451495150,
  //   9781455563937,
  //   9781101972120,
  //   9780679450047,
  //   9780525556534,
  //   9780316509848,
  //   9781250174673,
  //   9780743449014,
  //   9781250217318,
  //   9780765387561,
  //   9781573222457,
  //   9780756404079,
  //   9781982136468,
  //   9780316547604,
  //   9781501139239,
  //   9780593286104,
  //   9781501160349,
  //   9780307592736,
  //   9781250074713,  ];
  const books = isbns.map(
    isbn => <Book isbn={isbn} minimal={true} key={isbn}/>
  );

  return (
    <>
      <Head>
        <title>Reading Glasses Recommended Books</title>
        <meta name="description" content="All the books recommended from the podcast Reading Glasses" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        {books}
      </main>
    </>
  );
}
