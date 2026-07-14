"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../.env' });
const prisma_1 = __importDefault(require("../src/prisma"));
const embedding_1 = require("../src/services/embedding");
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
        const source = await prisma_1.default.source.create({
            data: {
                type: item.type,
                title: item.title,
                rawText: item.content,
            }
        });
        for (const tagName of item.tags) {
            const tag = await prisma_1.default.tag.upsert({
                where: { name: tagName },
                update: {},
                create: { name: tagName }
            });
            await prisma_1.default.sourceTag.create({
                data: { sourceId: source.id, tagId: tag.id }
            });
        }
        const chunks = await (0, embedding_1.splitText)(item.content);
        const embeddings = await (0, embedding_1.embedTexts)(chunks);
        for (let i = 0; i < chunks.length; i++) {
            const chunkId = require('crypto').randomBytes(12).toString('hex');
            const embeddingStr = `[${embeddings[i].join(',')}]`;
            await prisma_1.default.$executeRaw `
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
//# sourceMappingURL=seed.js.map