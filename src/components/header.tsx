import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import styles from "@/styles/header.module.css";

export default function Header() {
    const {status, data} = useSession();

    return (
        <div className={styles.bar}>
            <Image src='/rg-logo.png' height={64} width={64} alt="Reading Glasses Logo"/>
            <Link href='/'>RGDb - Reading Glasses Db</Link>
            <div className={styles.right}>
                {
                    status === 'unauthenticated' && <Link href="/api/auth/signin">Sign In</Link>
                }
                {
                    status === 'authenticated' && <><div>{data.user?.name}</div><Link href="/api/auth/signout">Sign Out</Link></>
                }
                {
                    status === 'loading' && <i>loading...</i>
                }
            </div>
        </div>
    )
}