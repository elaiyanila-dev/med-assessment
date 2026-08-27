import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  getAppointmentsDashboardData,
  getAppointmentDetails,
  createAppointment,
  registerPatientAndBookAppointment,
  checkInAppointmentToQueue,
  rescheduleAppointment,
  markAppointmentNoShow,
  cancelAppointment
} from "../services/appointment.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { prisma } from "../utils/prisma.js";

const createAppointmentSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  doctorId: z.string().min(1, "Doctor ID is required"),
  department: z.string().min(1, "Department is required"),
  type: z.string().optional(),
  scheduledAt: z.string().min(1, "Scheduled appointment time is required")
});

const registerAndBookSchema = z.object({
  name: z.string().min(1, "Patient full name is required"),
  gender: z.string().min(1, "Gender is required"),
  mobile: z.string().min(5, "Valid mobile number is required"),
  email: z.string().email().optional().or(z.literal("")),
  age: z.number().int().positive().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  priority: z.string().optional(),
  doctorId: z.string().min(1, "Doctor ID is required"),
  department: z.string().min(1, "Department is required"),
  type: z.string().optional(),
  scheduledAt: z.string().min(1, "Scheduled appointment time is required")
});

const checkInSchema = z.object({
  priority: z.string().optional(),
  source: z.enum(["CLINIC", "REMOTE"]).optional()
});

const rescheduleSchema = z.object({
  scheduledAt: z.string().min(1, "New appointment time is required"),
  reason: z.string().optional()
});

const cancelSchema = z.object({
  reason: z.string().optional()
});

export const getAppointmentsDashboard = async (
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
    const date = typeof req.query.date === "string" ? req.query.date : undefined;

    const data = await getAppointmentsDashboardData(user.id, user.role, search, statusFilter, date);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getAppointmentById = async (
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
      return sendError(res, "BAD_REQUEST", "Appointment ID is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true }
    });

    if (!user || user.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const data = await getAppointmentDetails(user.id, user.role, id);
    return sendSuccess(res, data);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postCreateAppointment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const parseResult = createAppointmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const data = await createAppointment(req.user.userId, parseResult.data);
    return sendSuccess(res, data, 201);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postRegisterAndBookAppointment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const parseResult = registerAndBookSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const data = await registerPatientAndBookAppointment(req.user.userId, parseResult.data);
    return sendSuccess(res, data, 201);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postCheckInAppointment = async (
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
      return sendError(res, "BAD_REQUEST", "Appointment ID is required", 400);
    }

    const parseResult = checkInSchema.safeParse(req.body || {});
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const data = await checkInAppointmentToQueue(req.user.userId, id, parseResult.data);
    return sendSuccess(res, data, 200);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const patchRescheduleAppointment = async (
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
      return sendError(res, "BAD_REQUEST", "Appointment ID is required", 400);
    }

    const parseResult = rescheduleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const data = await rescheduleAppointment(req.user.userId, id, parseResult.data);
    return sendSuccess(res, data, 200);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postMarkNoShow = async (
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
      return sendError(res, "BAD_REQUEST", "Appointment ID is required", 400);
    }

    const data = await markAppointmentNoShow(req.user.userId, id);
    return sendSuccess(res, data, 200);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postCancelAppointment = async (
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
      return sendError(res, "BAD_REQUEST", "Appointment ID is required", 400);
    }

    const parseResult = cancelSchema.safeParse(req.body || {});
    const reason = parseResult.success ? parseResult.data.reason : undefined;

    const data = await cancelAppointment(req.user.userId, id, reason);
    return sendSuccess(res, data, 200);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};
