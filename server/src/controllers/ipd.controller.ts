import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  getIPDDashboardData,
  getAdmissionDetails,
  createWardRound,
  createIPDIndent,
  createReturnWasteRecord,
  searchIPDMedicines,
  createAdmissionRecord,
  dischargeAdmissionRecord
} from "../services/ipd.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { WardRoundStatus, IPDIndentPriority, ReturnWasteType } from "@prisma/client";
import { prisma } from "../utils/prisma.js";

const createWardRoundSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  bedId: z.string().min(1, "Bed ID is required"),
  notes: z.string().nullable().optional(),
  status: z.nativeEnum(WardRoundStatus).optional()
});

const createIPDIndentSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  bedId: z.string().min(1, "Bed ID is required"),
  ward: z.string().min(1, "Ward is required"),
  priority: z.nativeEnum(IPDIndentPriority).optional(),
  items: z.array(
    z.object({
      medicineId: z.string().min(1, "Medicine ID is required"),
      dose: z.string().min(1, "Dose is required"),
      quantity: z.number().int().positive("Quantity must be positive"),
      packaging: z.string().nullable().optional()
    })
  ).min(1, "At least one medicine item is required")
});

const createReturnWasteSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  bedId: z.string().nullable().optional(),
  medicineId: z.string().min(1, "Medicine ID is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  type: z.nativeEnum(ReturnWasteType),
  reason: z.string().min(1, "Reason is required")
});

export const getIPDDashboard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getIPDDashboardData();
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getAdmissionById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { admissionId } = req.params;
    if (!admissionId) {
      return sendError(res, "BAD_REQUEST", "Admission ID is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true }
    });

    if (!user || user.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const data = await getAdmissionDetails(user.id, user.role, admissionId);
    return sendSuccess(res, data);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postWardRound = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const parseResult = createWardRoundSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const wardRound = await createWardRound(req.user.userId, parseResult.data);
    return sendSuccess(res, wardRound, 201);
  } catch (error) {
    next(error);
  }
};

export const postIPDIndent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const parseResult = createIPDIndentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const indent = await createIPDIndent(req.user.userId, parseResult.data);
    return sendSuccess(res, indent, 201);
  } catch (error) {
    next(error);
  }
};

export const postReturnWaste = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const parseResult = createReturnWasteSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const record = await createReturnWasteRecord(req.user.userId, parseResult.data);
    return sendSuccess(res, record, 201);
  } catch (error) {
    next(error);
  }
};

export const searchMedicines = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const medicines = await searchIPDMedicines(search);
    return sendSuccess(res, medicines);
  } catch (error) {
    next(error);
  }
};

const createAdmissionSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  bedId: z.string().min(1, "Bed ID is required"),
  doctorId: z.string().min(1, "Doctor ID is required"),
  reason: z.string().min(1, "Admission reason is required")
});

export const postAdmitPatient = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const parseResult = createAdmissionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true }
    });

    if (!user) {
      return sendError(res, "UNAUTHORIZED", "User profile not found", 401);
    }

    const admission = await createAdmissionRecord(user.id, user.role, parseResult.data);
    return sendSuccess(res, admission, 201);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postDischargePatient = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { admissionId } = req.params;
    if (!admissionId) {
      return sendError(res, "BAD_REQUEST", "Admission ID is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true }
    });

    if (!user) {
      return sendError(res, "UNAUTHORIZED", "User profile not found", 401);
    }

    const result = await dischargeAdmissionRecord(user.id, user.role, admissionId);
    return sendSuccess(res, result, 200);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

