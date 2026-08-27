import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  createEmergencyOverrideRecord,
  getEmergencyLogsList
} from "../services/emergency.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { prisma } from "../utils/prisma.js";

const emergencyOverrideSchema = z.object({
  scenario: z.string().min(1, "Emergency scenario is required"),
  action: z.string().min(1, "Emergency action is required"),
  reason: z.string().min(1, "Emergency override reason is mandatory"),
  patientId: z.string().optional(),
  items: z
    .array(
      z.object({
        entityType: z.string().min(1, "Entity type is required"),
        entityId: z.string().min(1, "Entity ID is required"),
        detail: z.string().min(1, "Item detail is required")
      })
    )
    .optional()
});

export const postEmergencyOverride = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true, deletedAt: true }
    });

    if (!user || user.status !== "ACTIVE" || user.deletedAt !== null) {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const parseResult = emergencyOverrideSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const record = await createEmergencyOverrideRecord(user.id, user.role, parseResult.data);
    return sendSuccess(res, record, 201);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const getEmergencyLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true, deletedAt: true }
    });

    if (!user || user.status !== "ACTIVE" || user.deletedAt !== null) {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const page = typeof req.query.page === "string" ? parseInt(req.query.page) || 1 : 1;
    const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit) || 20 : 20;

    const data = await getEmergencyLogsList(user.id, user.role, { page, limit });
    return sendSuccess(res, data);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};
