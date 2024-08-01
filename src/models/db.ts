import { PrismaClient } from "@prisma/client";

export default new PrismaClient();

export type Client = Omit<PrismaClient, '$on' | '$use' | '$connect' | '$disconnect' | '$use' | '$extends' | '$transaction'>;