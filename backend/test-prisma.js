"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../.env' });
try {
    const prisma1 = new client_1.PrismaClient({ url: process.env.DATABASE_URL });
    console.log("Success 1");
}
catch (e) {
    console.log("Error 1:", e.message);
}
try {
    const prisma2 = new client_1.PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
    console.log("Success 2");
}
catch (e) {
    console.log("Error 2:", e.message);
}
try {
    // Let's look at the generated types
    console.log("Keys available in options:", Object.keys({}));
}
catch (e) { }
//# sourceMappingURL=test-prisma.js.map