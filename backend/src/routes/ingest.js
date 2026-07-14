"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const unpdf_1 = require("unpdf");
const cheerio = __importStar(require("cheerio"));
const prisma_1 = __importDefault(require("../prisma"));
const embedding_1 = require("../services/embedding");
const router = (0, express_1.Router)();
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
async function ingestText(type, content, title, originalUrl, tags) {
    // Save Source
    const source = await prisma_1.default.source.create({
        data: {
            type,
            title,
            originalUrl,
            rawText: content,
        }
    });
    // Handle Tags
    if (tags && tags.length > 0) {
        for (const tagName of tags) {
            const tag = await prisma_1.default.tag.upsert({
                where: { name: tagName },
                update: {},
                create: { name: tagName }
            });
            await prisma_1.default.sourceTag.create({
                data: { sourceId: source.id, tagId: tag.id }
            });
        }
    }
    // Chunk & Embed
    // Prepend title and URL into each chunk text so vector search can match on metadata (e.g. "marvel rivals video")
    const metaPrefix = [title ? `Title: ${title}` : '', originalUrl ? `URL: ${originalUrl}` : ''].filter(Boolean).join(' | ');
    const chunks = await (0, embedding_1.splitText)(content);
    const enrichedChunks = chunks.map(c => metaPrefix ? `${metaPrefix}\n${c}` : c);
    const embeddings = await (0, embedding_1.embedTexts)(enrichedChunks);
    for (let i = 0; i < chunks.length; i++) {
        const chunkId = require('crypto').randomBytes(12).toString('hex');
        const embedding = embeddings[i];
        if (!embedding)
            continue;
        const embeddingStr = `[${embedding.join(',')}]`;
        await prisma_1.default.$executeRaw `
      INSERT INTO "Chunk" (id, "sourceId", content, "chunkIndex", embedding, "createdAt")
      VALUES (${chunkId}, ${source.id}, ${chunks[i]}, ${i}, ${embeddingStr}::vector, NOW())
    `;
    }
    return source;
}
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { type, content, title, tags: tagsStr } = req.body;
        let tags = [];
        if (tagsStr) {
            try {
                tags = JSON.parse(tagsStr);
            }
            catch (e) {
                tags = [tagsStr];
            }
        }
        if (type === 'file' && req.file) {
            if (req.file.size > MAX_FILE_SIZE_BYTES) {
                return res.status(400).json({ error: 'File too large. Maximum size is 20MB.' });
            }
            const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            let downloadUrl = '';
            if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
                const { createClient } = require('@supabase/supabase-js');
                const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
                const { data, error } = await supabase.storage.from('recall-files').upload(filename, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });
                if (error) {
                    console.error("Supabase upload error:", error);
                    return res.status(500).json({ error: 'Failed to upload file to permanent storage' });
                }
                const { data: publicUrlData } = supabase.storage.from('recall-files').getPublicUrl(filename);
                downloadUrl = publicUrlData.publicUrl;
            }
            else {
                // Fallback to local storage if Supabase is not configured yet
                const fs = require('fs');
                const path = require('path');
                fs.writeFileSync(path.resolve(process.cwd(), 'uploads', filename), req.file.buffer);
                downloadUrl = `/api/proxy/uploads/${filename}`;
            }
            let extractedText = '';
            if (req.file.mimetype === 'application/pdf') {
                console.log("Extracting PDF using unpdf...");
                try {
                    const { text } = await (0, unpdf_1.extractText)(new Uint8Array(req.file.buffer));
                    extractedText = Array.isArray(text) ? text.join('\n') : String(text);
                }
                catch (e) {
                    console.warn("PDF extraction failed, falling back to metadata only:", e);
                }
            }
            else {
                extractedText = req.file.buffer.toString('utf-8');
            }
            // Strip null bytes — Postgres UTF-8 rejects \x00
            extractedText = extractedText.replace(/\x00/g, '');
            // If no text could be extracted (e.g. scanned PDF), fallback to metadata
            if (!extractedText.trim()) {
                extractedText = `[Scanned Document] Filename: ${req.file.originalname}`;
            }
            const source = await ingestText('file', extractedText, title || req.file.originalname, downloadUrl, tags);
            return res.json({ success: true, source });
        }
        if (type === 'url') {
            const response = await fetch(content);
            const html = await response.text();
            const $ = cheerio.load(html);
            $('script, style, noscript, iframe, img, svg').remove();
            const extractedText = $('body').text().replace(/\s+/g, ' ').trim();
            const pageTitle = $('title').text() || title;
            if (!extractedText)
                return res.status(400).json({ error: 'No text could be extracted from this URL' });
            const source = await ingestText('url', extractedText, pageTitle, content, tags);
            return res.json({ success: true, source });
        }
        if (type === 'text') {
            const source = await ingestText('text', content, title, undefined, tags);
            return res.json({ success: true, source });
        }
        return res.status(400).json({ error: 'Invalid type or missing content' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to ingest content' });
    }
});
exports.default = router;
//# sourceMappingURL=ingest.js.map