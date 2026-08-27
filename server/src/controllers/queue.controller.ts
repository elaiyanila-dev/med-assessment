import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { getDoctorQueueData, updateQueueEntryStatus } from "../services/queue.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { prisma } from "../utils/prisma.js";
import { QueueStatus } from "@prisma/client";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.nativeEnum(QueueStatus, {
    errorMap: () => ({ message: "Invalid queue status provided" })
  })
});

export const getQueue = async (
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

export const updateStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const queueId = req.params.id;
    if (!queueId) {
      return sendError(res, "BAD_REQUEST", "Queue ID parameter is required", 400);
    }

    const parseResult = updateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors[0]?.message || "Invalid request body";
      return sendError(res, "BAD_REQUEST", errorMessage, 400);
    }

    const updatedEntry = await updateQueueEntryStatus(
      req.user.userId,
      queueId,
      parseResult.data.status
    );

    return sendSuccess(res, updatedEntry);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};
