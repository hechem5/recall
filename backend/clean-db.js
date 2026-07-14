"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("./src/prisma"));
async function run() {
    const allSources = await prisma_1.default.source.findMany({ select: { id: true, rawText: true, title: true } });
    const badIds = allSources.filter(s => s.rawText && s.rawText.includes('\x00')).map(s => s.id);
    console.log('Bad IDs to delete:', badIds);
    if (badIds.length > 0) {
        await prisma_1.default.chunk.deleteMany({ where: { sourceId: { in: badIds } } });
        await prisma_1.default.source.deleteMany({ where: { id: { in: badIds } } });
        console.log('Deleted', badIds.length, 'corrupted source(s)');
    }
    else {
        console.log('No corrupted sources found');
    }
    await prisma_1.default.$disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
//# sourceMappingURL=clean-db.js.map