import { Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";
import { AuthenticatedRequest } from "./auth.middleware.js";

export const httpLoggingMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    logger.info("HTTP Request Completed", {
      requestId: req.id,
      method: req.method,
      route: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      userId: req.user?.userId,
      role: req.user?.role
    });
  });

  next();
};
