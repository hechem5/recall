import prisma from './prisma';

async function main() {
  const sources = await prisma.source.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      chunks: {
        select: { id: true, content: true }
      }
    }
  });
  console.log(JSON.stringify(sources, null, 2));
}

main().finally(() => prisma.$disconnect());
