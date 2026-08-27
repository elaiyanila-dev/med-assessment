import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  getPharmacyDashboardData,
  getPrescriptionDetails,
  getMedicineCatalog,
  dispensePrescription
} from "../services/pharmacy.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { prisma } from "../utils/prisma.js";

const dispenseSchema = z.object({
  items: z
    .array(
      z.object({
        prescriptionItemId: z.string().min(1, "Prescription item ID is required"),
        quantity: z.number().int().min(1, "Dispense quantity must be at least 1")
      })
    )
    .min(1, "At least one medication item is required for dispensing")
});

export const getPharmacyDashboard = async (
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
      select: { id: true, role: true, status: true }
    });

    if (!user || user.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const statusFilter = typeof req.query.status === "string" ? req.query.status : undefined;

    const data = await getPharmacyDashboardData(user.id, user.role, search, statusFilter);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getPrescriptionById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { prescriptionId } = req.params;
    if (!prescriptionId) {
      return sendError(res, "BAD_REQUEST", "Prescription ID is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true }
    });

    if (!user || user.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const data = await getPrescriptionDetails(user.id, user.role, prescriptionId);
    return sendSuccess(res, data);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const getMedicines = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const data = await getMedicineCatalog(search);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const postDispensePrescription = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { prescriptionId } = req.params;
    if (!prescriptionId) {
      return sendError(res, "BAD_REQUEST", "Prescription ID is required", 400);
    }

    const parseResult = dispenseSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const result = await dispensePrescription(req.user.userId, prescriptionId, parseResult.data);
    return sendSuccess(res, result, 201);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};
