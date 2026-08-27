import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { getDashboardDataForDoctor } from "../services/dashboard.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { prisma } from "../utils/prisma.js";

export const getDashboard = async (
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
      select: { id: true, name: true, role: true, status: true, deletedAt: true }
    });

    if (!user || user.status !== "ACTIVE" || user.deletedAt !== null) {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const dashboardData = await getDashboardDataForDoctor(
      user.id,
      user.role,
      user.name
    );

    return sendSuccess(res, dashboardData);
  } catch (error) {
    next(error);
  }
};
