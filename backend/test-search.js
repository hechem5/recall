"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../.env' });
async function test() {
    try {
        const res = await fetch("http://localhost:3001/api/search?q=youtube", {
            headers: { "Authorization": `Bearer ${process.env.APP_PASSWORD}` }
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
//# sourceMappingURL=test-search.js.map