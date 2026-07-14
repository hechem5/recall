import prisma from './src/prisma';

async function main() {
  console.log("Adding defaults back to fix drift...");
  await prisma.$executeRawUnsafe(`ALTER TABLE "Digest" ALTER COLUMN "safeId" SET DEFAULT 'default_safe';`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Source" ALTER COLUMN "safeId" SET DEFAULT 'default_safe';`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Tag" ALTER COLUMN "safeId" SET DEFAULT 'default_safe';`);
  console.log("Done.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
