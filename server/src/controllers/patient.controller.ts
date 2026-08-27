import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  getPatientDirectoryData,
  getPatientProfileDetails,
  createPatientRecord,
  updatePatientDemographics,
  addPatientAllergy,
  removePatientAllergy,
  addPatientCondition,
  updatePatientCondition,
  softDeletePatient
} from "../services/patient.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { prisma } from "../utils/prisma.js";

const createPatientSchema = z.object({
  name: z.string().min(1, "Patient full name is required"),
  gender: z.string().min(1, "Gender is required"),
  mobile: z.string().min(5, "Valid mobile number is required"),
  email: z.string().email().optional().or(z.literal("")),
  age: z.number().int().positive().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  priority: z.string().optional(),
  department: z.string().optional()
});

const updatePatientSchema = z.object({
  name: z.string().min(1).optional(),
  gender: z.string().min(1).optional(),
  mobile: z.string().min(5).optional(),
  email: z.string().email().optional().or(z.literal("")),
  age: z.number().int().positive().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  priority: z.string().optional(),
  department: z.string().optional()
});

const addAllergySchema = z.object({
  allergen: z.string().min(1, "Allergen name is required"),
  severity: z.string().optional(),
  reaction: z.string().optional()
});

const addConditionSchema = z.object({
  condition: z.string().min(1, "Medical condition description is required"),
  status: z.string().optional(),
  diagnosed: z.string().optional()
});

const updateConditionSchema = z.object({
  status: z.string().min(1, "Condition status is required")
});

const deletePatientSchema = z.object({
  reason: z.string().optional()
});

export const getPatientDirectory = async (
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
    const registrationType = typeof req.query.registrationType === "string" ? req.query.registrationType : undefined;
    const bloodGroup = typeof req.query.bloodGroup === "string" ? req.query.bloodGroup : undefined;
    const priority = typeof req.query.priority === "string" ? req.query.priority : undefined;
    const page = typeof req.query.page === "string" ? parseInt(req.query.page) || 1 : 1;
    const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit) || 20 : 20;

    const data = await getPatientDirectoryData(
      user.id,
      user.role,
      search,
      registrationType,
      bloodGroup,
      priority,
      page,
      limit
    );
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getPatientById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { id } = req.params;
    if (!id) {
      return sendError(res, "BAD_REQUEST", "Patient ID is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true }
    });

    if (!user || user.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const data = await getPatientProfileDetails(user.id, user.role, id);
    return sendSuccess(res, data);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postCreatePatient = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const parseResult = createPatientSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const data = await createPatientRecord(req.user.userId, parseResult.data);
    return sendSuccess(res, data, 201);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const patchUpdatePatientDemographics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { id } = req.params;
    if (!id) {
      return sendError(res, "BAD_REQUEST", "Patient ID is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true }
    });

    if (!user || user.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const parseResult = updatePatientSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const data = await updatePatientDemographics(user.id, user.role, id, parseResult.data);
    return sendSuccess(res, data, 200);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postAddAllergy = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { id } = req.params;
    if (!id) {
      return sendError(res, "BAD_REQUEST", "Patient ID is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true }
    });

    if (!user || user.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const parseResult = addAllergySchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const data = await addPatientAllergy(user.id, user.role, id, parseResult.data);
    return sendSuccess(res, data, 201);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const deleteRemoveAllergy = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { id, allergyId } = req.params;
    if (!id || !allergyId) {
      return sendError(res, "BAD_REQUEST", "Patient ID and Allergy ID are required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true }
    });

    if (!user || user.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const data = await removePatientAllergy(user.id, user.role, id, allergyId);
    return sendSuccess(res, data, 200);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postAddCondition = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { id } = req.params;
    if (!id) {
      return sendError(res, "BAD_REQUEST", "Patient ID is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true }
    });

    if (!user || user.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const parseResult = addConditionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const data = await addPatientCondition(user.id, user.role, id, parseResult.data);
    return sendSuccess(res, data, 201);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const patchUpdateCondition = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { id, conditionId } = req.params;
    if (!id || !conditionId) {
      return sendError(res, "BAD_REQUEST", "Patient ID and Condition ID are required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true }
    });

    if (!user || user.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const parseResult = updateConditionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const data = await updatePatientCondition(user.id, user.role, id, conditionId, parseResult.data);
    return sendSuccess(res, data, 200);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const deleteSoftDeletePatient = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { id } = req.params;
    if (!id) {
      return sendError(res, "BAD_REQUEST", "Patient ID is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true }
    });

    if (!user || user.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const parseResult = deletePatientSchema.safeParse(req.body || {});
    const reason = parseResult.success ? parseResult.data.reason : undefined;

    const data = await softDeletePatient(user.id, user.role, id, reason);
    return sendSuccess(res, data, 200);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};
