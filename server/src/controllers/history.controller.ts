import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  searchPatientsForHistory,
  getPatientHistoryDetails,
  getHistoryEventDetail
} from "../services/history.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { prisma } from "../utils/prisma.js";

export const searchPatients = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const patients = await searchPatientsForHistory(search);
    return sendSuccess(res, patients);
  } catch (error) {
    next(error);
  }
};

export const getPatientHistory = async (
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
      return sendError(res, "BAD_REQUEST", "Patient ID is required", 400);
    }

    const filter = typeof req.query.filter === "string" ? req.query.filter : undefined;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true, deletedAt: true }
    });

    if (!user || user.status !== "ACTIVE" || user.deletedAt !== null) {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const historyData = await getPatientHistoryDetails(
      user.id,
      user.role,
      patientId,
      filter
    );

    return sendSuccess(res, historyData);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const getEventDetail = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { eventId } = req.params;
    if (!eventId) {
      return sendError(res, "BAD_REQUEST", "Event ID is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true, deletedAt: true }
    });

    if (!user || user.status !== "ACTIVE" || user.deletedAt !== null) {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const event = await getHistoryEventDetail(user.id, user.role, eventId);
    return sendSuccess(res, event);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};
