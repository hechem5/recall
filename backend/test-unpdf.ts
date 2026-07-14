import { extractText } from 'unpdf';
import fs from 'fs';

async function test() {
  try {
    const pdfBuffer = fs.readFileSync("valid_test.pdf");
    const { text, totalPages } = await extractText(new Uint8Array(pdfBuffer));
    console.log("Success! Extracted", text.length, "characters from", totalPages, "pages");
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
