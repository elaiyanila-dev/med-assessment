import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { UserRole } from "@prisma/client";
import {
  getUserDirectory,
  getUserProfileDetails,
  createUserRecord,
  updateUserDemographics,
  updateUserStatus,
  resetUserPassword,
  softDeleteUser
} from "../services/user.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { prisma } from "../utils/prisma.js";

const createUserSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email address is required"),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: "Valid UserRole is required" }) }),
  department: z.string().optional(),
  specialization: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters long").optional()
});

const updateUserSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  specialization: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"], {
    errorMap: () => ({ message: "Status must be ACTIVE, INACTIVE, or SUSPENDED" })
  })
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters long")
});

export const getDirectory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const actor = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true }
    });

    if (!actor || actor.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const roleFilter = typeof req.query.role === "string" ? req.query.role : undefined;
    const departmentFilter = typeof req.query.department === "string" ? req.query.department : undefined;
    const statusFilter = typeof req.query.status === "string" ? req.query.status : undefined;
    const page = typeof req.query.page === "string" ? parseInt(req.query.page) || 1 : 1;
    const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit) || 20 : 20;

    const data = await getUserDirectory(
      actor.id,
      actor.role,
      search,
      roleFilter,
      departmentFilter,
      statusFilter,
      page,
      limit
    );
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
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
      return sendError(res, "BAD_REQUEST", "Target user ID is required", 400);
    }

    const actor = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true }
    });

    if (!actor || actor.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const data = await getUserProfileDetails(actor.id, actor.role, id);
    return sendSuccess(res, data);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postCreateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const data = await createUserRecord(req.user.userId, parseResult.data);
    return sendSuccess(res, data, 201);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const patchUpdateDemographics = async (
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
      return sendError(res, "BAD_REQUEST", "Target user ID is required", 400);
    }

    const actor = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true }
    });

    if (!actor || actor.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const parseResult = updateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const data = await updateUserDemographics(actor.id, actor.role, id, parseResult.data);
    return sendSuccess(res, data, 200);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const patchUpdateStatus = async (
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
      return sendError(res, "BAD_REQUEST", "Target user ID is required", 400);
    }

    const actor = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true }
    });

    if (!actor || actor.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const parseResult = updateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const data = await updateUserStatus(actor.id, actor.role, id, parseResult.data.status);
    return sendSuccess(res, data, 200);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postResetPassword = async (
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
      return sendError(res, "BAD_REQUEST", "Target user ID is required", 400);
    }

    const actor = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true }
    });

    if (!actor || actor.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const data = await resetUserPassword(actor.id, actor.role, id, parseResult.data.newPassword);
    return sendSuccess(res, data, 200);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const deleteUser = async (
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
      return sendError(res, "BAD_REQUEST", "Target user ID is required", 400);
    }

    const actor = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true }
    });

    if (!actor || actor.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const data = await softDeleteUser(actor.id, actor.role, id);
    return sendSuccess(res, data, 200);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};
