import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
export default db;

export type Client = Omit<PrismaClient, '$on' | '$use' | '$connect' | '$disconnect' | '$use' | '$extends' | '$transaction'>;
