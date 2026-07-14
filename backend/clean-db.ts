import prisma from './src/prisma';

async function run() {
  const allSources = await prisma.source.findMany({ select: { id: true, rawText: true, title: true } });
  const badIds = allSources.filter(s => s.rawText && s.rawText.includes('\x00')).map(s => s.id);
  console.log('Bad IDs to delete:', badIds);
  
  if (badIds.length > 0) {
    await prisma.chunk.deleteMany({ where: { sourceId: { in: badIds } } });
    await prisma.source.deleteMany({ where: { id: { in: badIds } } });
    console.log('Deleted', badIds.length, 'corrupted source(s)');
  } else {
    console.log('No corrupted sources found');
  }
  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
