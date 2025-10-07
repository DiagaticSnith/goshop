"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
let prisma;
if (process.env.NODE_ENV === "prod") {
    prisma = new client_1.PrismaClient({
        errorFormat: "minimal"
    });
}
else {
    if (!global.prisma) {
        global.prisma = new client_1.PrismaClient({
            errorFormat: "minimal"
        });
    }
    prisma = global.prisma;
}
exports.default = prisma;
