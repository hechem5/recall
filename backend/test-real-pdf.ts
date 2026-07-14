import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

async function test() {
  try {
    console.log("Downloading a real valid PDF...");
    const resPdf = await fetch("https://www.clickdimensions.com/links/TestPdfDocument.pdf");
    const arrayBuf = await resPdf.arrayBuffer();
    fs.writeFileSync("valid_test.pdf", Buffer.from(arrayBuf));
    
    console.log("Reading valid PDF from disk...");
    const pdfBuffer = fs.readFileSync("valid_test.pdf");

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
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}
test();
