"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const buffer_1 = require("buffer");
dotenv_1.default.config({ path: '../.env' });
async function test() {
    try {
        // Download a valid dummy PDF
        const pdfRes = await fetch("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf");
        const pdfBuffer = await pdfRes.arrayBuffer();
        const formData = new FormData();
        formData.append('type', 'file');
        formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), 'dummy.pdf');
        console.log("Uploading PDF...");
        const res = await fetch("http://localhost:3001/api/ingest", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.APP_PASSWORD}` },
            body: formData
        });
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response:", text);
    }
    catch (e) {
        console.error("Fetch failed:", e);
    }
}
test();
//# sourceMappingURL=test-upload-real.js.map