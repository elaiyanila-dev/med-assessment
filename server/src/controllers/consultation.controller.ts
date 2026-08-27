import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  getActiveConsultationForPatient,
  startConsultationSession,
  saveVitalsRecord,
  saveConsultationNotesRecord,
  searchMedicinesList,
  createPrescriptionRecord,
  getAvailableLabTestsList,
  createLabOrderRecord,
  finishConsultationRecord
} from "../services/consultation.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { prisma } from "../utils/prisma.js";
import { LabPriority } from "@prisma/client";
import { z } from "zod";

// Zod Validation Schemas
const startConsultationSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  queueId: z.string().optional()
});

const vitalsSchema = z.object({
  systolicBP: z.number().optional(),
  diastolicBP: z.number().optional(),
  spo2: z.number().optional(),
  temperature: z.number().optional(),
  weight: z.number().optional()
});

const notesSchema = z.object({
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  icd10Code: z.string().optional()
});

const prescriptionItemSchema = z.object({
  medicineId: z.string().min(1, "Medicine ID is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  durationDays: z.number().min(1, "Duration days is required"),
  quantity: z.number().min(1, "Quantity is required")
});

const createPrescriptionSchema = z.object({
  items: z.array(prescriptionItemSchema).min(1, "At least one medicine item is required")
});

const createLabOrderSchema = z.object({
  testIds: z.array(z.string()).min(1, "At least one lab test ID is required"),
  priority: z.nativeEnum(LabPriority).optional()
});

const finishSchema = z.object({
  queueId: z.string().optional()
});

export const postStartConsultation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const parseResult = startConsultationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(
        res,
        "BAD_REQUEST",
        parseResult.error.errors[0]?.message || "Invalid start consultation request",
        400
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true, deletedAt: true }
    });

    if (!user || user.status !== "ACTIVE" || user.deletedAt !== null) {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const sessionData = await startConsultationSession(
      user.id,
      user.role,
      parseResult.data.patientId,
      parseResult.data.queueId
    );

    return sendSuccess(res, sessionData);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const getConsultationSession = async (
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

    const queueId = typeof req.query.queueId === "string" ? req.query.queueId : undefined;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true, deletedAt: true }
    });

    if (!user || user.status !== "ACTIVE" || user.deletedAt !== null) {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const sessionData = await getActiveConsultationForPatient(
      user.id,
      user.role,
      patientId,
      queueId
    );

    return sendSuccess(res, sessionData);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postVitals = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { id } = req.params;
    const parseResult = vitalsSchema.safeParse(req.body);

    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0]?.message || "Invalid vitals data", 400);
    }

    const savedVital = await saveVitalsRecord(req.user.userId, id, parseResult.data);
    return sendSuccess(res, savedVital);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const patchNotes = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { id } = req.params;
    const parseResult = notesSchema.safeParse(req.body);

    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0]?.message || "Invalid notes data", 400);
    }

    const updatedConsultation = await saveConsultationNotesRecord(req.user.userId, id, parseResult.data);
    return sendSuccess(res, updatedConsultation);
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
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const medicines = await searchMedicinesList(search);
    return sendSuccess(res, medicines);
  } catch (error) {
    next(error);
  }
};

export const postPrescription = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { id } = req.params;
    const parseResult = createPrescriptionSchema.safeParse(req.body);

    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0]?.message || "Invalid prescription data", 400);
    }

    const prescription = await createPrescriptionRecord(req.user.userId, id, parseResult.data.items);
    return sendSuccess(res, prescription);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const getLabTests = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const tests = await getAvailableLabTestsList();
    return sendSuccess(res, tests);
  } catch (error) {
    next(error);
  }
};

export const postLabOrders = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { id } = req.params;
    const parseResult = createLabOrderSchema.safeParse(req.body);

    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0]?.message || "Invalid lab order data", 400);
    }

    const labOrder = await createLabOrderRecord(
      req.user.userId,
      id,
      parseResult.data.testIds,
      parseResult.data.priority
    );
    return sendSuccess(res, labOrder);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postFinish = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { id } = req.params;
    const parseResult = finishSchema.safeParse(req.body || {});

    const queueId = parseResult.success ? parseResult.data.queueId : undefined;

    const completedConsultation = await finishConsultationRecord(
      req.user.userId,
      id,
      queueId
    );

    return sendSuccess(res, completedConsultation);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};
