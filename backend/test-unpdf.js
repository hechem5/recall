"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const unpdf_1 = require("unpdf");
const fs_1 = __importDefault(require("fs"));
async function test() {
    try {
        const pdfBuffer = fs_1.default.readFileSync("valid_test.pdf");
        const { text, totalPages } = await (0, unpdf_1.extractText)(new Uint8Array(pdfBuffer));
        console.log("Success! Extracted", text.length, "characters from", totalPages, "pages");
    }
    catch (e) {
        console.error("Error:", e);
    }
}
test();
//# sourceMappingURL=test-unpdf.js.map