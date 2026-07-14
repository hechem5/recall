import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import prisma from '../src/prisma';
import { splitText, embedTexts } from '../src/services/embedding';

async function seed() {
  console.log('Seeding database...');
  
  const sampleData = [
    {
      type: 'text',
      title: 'Project Ideas',
      content: 'I want to build a personal semantic memory search engine called Recall. It will use Next.js on Vercel, Node.js on Render, and Neon Postgres with pgvector for embeddings. Embeddings will be generated with OpenAI.',
      tags: ['projects', 'ideas']
    },
    {
      type: 'text',
      title: 'Meeting Notes - June 10',
      content: 'Discussed the marketing strategy for the new product launch. We will focus on social media ads and influencer partnerships. Need to finalize budget by Friday.',
      tags: ['work', 'notes']
    }
  ];

  for (const item of sampleData) {
    const source = await prisma.source.create({
      data: {
        type: item.type,
        title: item.title,
        rawText: item.content,
      }
    });

    for (const tagName of item.tags) {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName }
      });
      await prisma.sourceTag.create({
        data: { sourceId: source.id, tagId: tag.id }
      });
    }

    const chunks = await splitText(item.content);
    const embeddings = await embedTexts(chunks);

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = require('crypto').randomBytes(12).toString('hex');
      const embeddingStr = `[${embeddings[i].join(',')}]`;
      
      await prisma.$executeRaw`
        INSERT INTO "Chunk" (id, "sourceId", content, "chunkIndex", embedding, "createdAt")
        VALUES (${chunkId}, ${source.id}, ${chunks[i]}, ${i}, ${embeddingStr}::vector, NOW())
      `;
    }
    console.log(`Seeded: ${item.title}`);
  }

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch(console.error);
