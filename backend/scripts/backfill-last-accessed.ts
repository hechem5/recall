import prisma from '../src/prisma';

async function main() {
  console.log('Starting backfill for lastAccessedAt...');
  
  // Update all sources where lastAccessedAt equals the default (now) or is older/newer,
  // simply setting it to createdAt for all existing records to ensure they are eligible for the orphan check.
  const result = await prisma.$executeRaw`
    UPDATE "Source" 
    SET "lastAccessedAt" = "createdAt"
  `;
  
  console.log(`Backfill complete. Records updated.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
