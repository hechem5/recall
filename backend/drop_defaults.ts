import prisma from './src/prisma';

async function main() {
  console.log("Dropping defaults to fix drift...");
  await prisma.$executeRawUnsafe(`ALTER TABLE "Digest" ALTER COLUMN "safeId" DROP DEFAULT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Source" ALTER COLUMN "safeId" DROP DEFAULT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Tag" ALTER COLUMN "safeId" DROP DEFAULT;`);
  console.log("Done.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
