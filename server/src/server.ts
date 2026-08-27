import app from "./app.js";
import { config } from "./config/env.js";
import { prisma } from "./utils/prisma.js";
import { logger } from "./utils/logger.js";

async function main() {
  try {
    // Verify database connectivity on startup
    await prisma.$connect();
    logger.info("Database connection established successfully.");

    const server = app.listen(config.port, () => {
      logger.info(`Server listening on http://localhost:${config.port}`, {
        environment: config.nodeEnv,
        port: config.port
      });
    });

    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        logger.info("HTTP server closed. Disconnecting database...");
        try {
          await prisma.$disconnect();
          logger.info("Database connection closed cleanly. Exiting process.");
          process.exit(0);
        } catch (err: any) {
          logger.error("Error during database disconnect:", { error: err.message });
          process.exit(1);
        }
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error: any) {
    logger.error("Failed to start server:", { error: error.message });
    process.exit(1);
  }
}

main();
