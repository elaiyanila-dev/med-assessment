import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { getDoctorStationPatientContext } from "../services/doctorStation.service.js";
import { getDoctorQueueData } from "../services/queue.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { prisma } from "../utils/prisma.js";

export const getPatientContext = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { patientId } = req.params;
    if (!patientId) {
      return sendError(res, "BAD_REQUEST", "Patient ID parameter is required", 400);
    }

    const queueId = typeof req.query.queueId === "string" ? req.query.queueId : undefined;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true, deletedAt: true }
    });

    if (!user || user.status !== "ACTIVE" || user.deletedAt !== null) {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const contextData = await getDoctorStationPatientContext(
      user.id,
      user.role,
      patientId,
      queueId
    );

    return sendSuccess(res, contextData);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const getStationQueue = async (
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
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const queueData = await getDoctorQueueData(user.id, user.role, { search, status });

    return sendSuccess(res, queueData);
  } catch (error) {
    next(error);
  }
};
