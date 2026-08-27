import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { getAuditLogsList } from "../services/audit.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { prisma } from "../utils/prisma.js";

export const getAuditLogs = async (
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

    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const action = typeof req.query.action === "string" ? req.query.action : undefined;
    const entityType = typeof req.query.entityType === "string" ? req.query.entityType : undefined;
    const filterActorId = typeof req.query.actorId === "string" ? req.query.actorId : undefined;
    const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;
    const page = typeof req.query.page === "string" ? parseInt(req.query.page) || 1 : 1;
    const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit) || 20 : 20;

    const data = await getAuditLogsList(user.id, user.role, {
      search,
      action,
      entityType,
      filterActorId,
      startDate,
      endDate,
      page,
      limit
    });

    return sendSuccess(res, data);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};
