"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../.env' });
async function test() {
    try {
        console.log("Downloading a real valid PDF...");
        const resPdf = await fetch("https://www.clickdimensions.com/links/TestPdfDocument.pdf");
        const arrayBuf = await resPdf.arrayBuffer();
        fs_1.default.writeFileSync("valid_test.pdf", Buffer.from(arrayBuf));
        console.log("Reading valid PDF from disk...");
        const pdfBuffer = fs_1.default.readFileSync("valid_test.pdf");
        const formData = new FormData();
        formData.append('type', 'file');
        formData.append('title', 'Test PDF');
        formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), 'valid_test.pdf');
        console.log("Uploading PDF to backend...");
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
//# sourceMappingURL=test-real-pdf.js.map