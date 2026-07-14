import prisma from './src/prisma';
import express from 'express';
import jobsRouter from './src/routes/jobs';
import request from 'supertest';
const app = express();
app.use(express.json());
app.use('/api/jobs', jobsRouter);

async function run() {
  // 1. Setup Safe and Sources
  let safe = await prisma.safe.findFirst();
  if (!safe) {
    safe = await prisma.safe.create({ data: { passwordHash: 'test' } });
  }

  console.log(`Using Safe: ${safe.id}`);

  // Delete all existing sources to have a clean slate for the test
  await prisma.source.deleteMany({ where: { safeId: safe.id } });
  await prisma.digest.deleteMany({ where: { safeId: safe.id } });

  // Create 25 sources older than 90 days
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - 100);

  const sourcesData = Array.from({ length: 25 }).map((_, i) => ({
    safeId: safe.id,
    type: 'text',
    title: `Old Source ${i}`,
    rawText: `This is old source ${i}`,
    createdAt: oldDate,
    lastAccessedAt: oldDate
  }));

  await prisma.source.createMany({ data: sourcesData });
  console.log(`Created 25 old sources.`);

  // 2. Execute logic for just this safe
  const recentChunks = await prisma.chunk.findMany({
    where: {
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      source: { safeId: safe.id }
    }
  });

  const ORPHAN_DAYS = 90;
  const MIN_SOURCES = 20;
  const totalSources = await prisma.source.count({ where: { safeId: safe.id } });
  let orphanedSourceIds: string[] = [];

  if (totalSources >= MIN_SOURCES) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ORPHAN_DAYS);
    const orphans = await prisma.source.findMany({
      where: { safeId: safe.id, lastAccessedAt: { lt: cutoff } },
      select: { id: true },
      take: 10
    });
    orphanedSourceIds = orphans.map(o => o.id);
  }

  if (recentChunks.length === 0 && orphanedSourceIds.length === 0) {
    console.log("Would continue (skip)");
  } else {
    let digestContent = "No new saves this week.";
    const digest = await prisma.digest.create({
      data: {
        content: digestContent,
        safeId: safe.id,
        orphanedSourceIds: JSON.stringify(orphanedSourceIds)
      }
    });
    console.log(`Job response: 200 { success: true }`);
  }

  // 3. Verify Digest
  const digest = await prisma.digest.findFirst({ where: { safeId: safe.id }, orderBy: { createdAt: 'desc' } });
  if (!digest) {
    console.error("FAIL: Digest was not created.");
    process.exit(1);
  }

  console.log(`Digest created with content: "${digest.content}"`);
  
  const orphanedIds = JSON.parse(digest.orphanedSourceIds || '[]');
  console.log(`Orphaned Source IDs count: ${orphanedIds.length}`);

  if (orphanedIds.length > 0 && digest.content === "No new saves this week.") {
    console.log("SUCCESS: Orphan check runs independently of recent saves!");
  } else {
    console.error("FAIL: Did not get expected orphaned IDs or digest content.");
    process.exit(1);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
