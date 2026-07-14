import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

try {
  const prisma1 = new PrismaClient({ url: process.env.DATABASE_URL } as any);
  console.log("Success 1");
} catch (e: any) {
  console.log("Error 1:", e.message);
}

try {
  const prisma2 = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
  console.log("Success 2");
} catch (e: any) {
  console.log("Error 2:", e.message);
}

try {
  // Let's look at the generated types
  console.log("Keys available in options:", Object.keys({} as import('@prisma/client').Prisma.PrismaClientOptions));
} catch (e: any) {}
