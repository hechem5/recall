"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config({ path: '../.env' });
// Very minimal PDF 1.0 valid buffer representing an empty page
const dummyPdf = Buffer.from("%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%EOF\n");
async function test() {
    const formData = new FormData();
    formData.append('type', 'file');
    formData.append('file', new Blob([dummyPdf], { type: 'application/pdf' }), 'test.pdf');
    try {
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
//# sourceMappingURL=test-upload.js.map