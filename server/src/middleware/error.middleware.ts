import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger.js";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = req.id;

  logger.error(err.message || "Internal Server Error", {
    requestId,
    method: req.method,
    route: req.originalUrl,
    code: err.code || "INTERNAL_SERVER_ERROR",
    statusCode: err.statusCode || 500,
    error: err.stack ? err.stack.split("\n")[0] : err.message
  });

  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => i.message).join(", ");
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: `Validation failed: ${issues}`,
        requestId
      }
    });
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";
  let message = err.message || "Internal Server Error";

  // Suppress SQL / Prisma stack trace leaks for HTTP 500 responses
  if (statusCode === 500 && (message.includes("Prisma") || message.includes("SELECT") || message.includes("prisma"))) {
    message = "An unexpected internal database error occurred";
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      requestId
    }
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.originalUrl} not found`,
      requestId: req.id
    }
  });
};
