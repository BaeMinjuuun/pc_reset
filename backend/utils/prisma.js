const { PrismaClient } = require("@prisma/client");

const prisma =
  global.prisma ||
  new PrismaClient({
    // log: ["query", "error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

module.exports = { prisma };
