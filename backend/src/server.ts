import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import prisma from "./utils/prisma";

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap() {
  try {
    // Fail fast if the database is unreachable.
    await prisma.$connect();
    console.log("Database connected.");

    const server = app.listen(PORT, () => {
      console.log(`Faculty CMS API listening on http://localhost:${PORT}`);
    });

    // Keep TCP connections alive — avoids per-request handshake overhead
    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 66_000;

    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

bootstrap();
