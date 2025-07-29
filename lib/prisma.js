// const { PrismaClient } = require("@prisma/client")

// export const db = globalThis.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== "production") {
//     globalThis.prisma = db;
// }

console.log("DATABASE_URL:", process.env.DATABASE_URL); // DEBUG

const { PrismaClient } = require("@prisma/client");

export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = db;
}