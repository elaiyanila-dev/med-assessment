import { Request, Response } from "express";
import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";

export const getHealth = async (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString()
  });
};

export const getReadiness = async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      success: true,
      status: "ready",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error("Readiness check failed: Database connection unavailable", {
      requestId: req.id,
      error: error.message
    });
    return res.status(503).json({
      success: false,
      status: "unhealthy",
      database: "disconnected",
      error: "Database connection unavailable",
      requestId: req.id
    });
  }
};
