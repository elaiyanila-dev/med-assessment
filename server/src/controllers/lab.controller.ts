import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  getLabDashboardData,
  getLabOrderDetails,
  collectLabSample,
  processLabOrder,
  recordLabResults,
  verifyLabResult
} from "../services/lab.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { prisma } from "../utils/prisma.js";

const collectSampleSchema = z.object({
  sampleId: z.string().optional(),
  accessionId: z.string().optional()
});

const recordResultsSchema = z.object({
  results: z
    .array(
      z.object({
        testId: z.string().min(1, "Test ID is required"),
        parameters: z
          .array(
            z.object({
              parameterName: z.string().min(1, "Parameter name is required"),
              resultValue: z.string().min(1, "Result value is required"),
              unit: z.string().min(1, "Unit is required"),
              referenceRange: z.string().min(1, "Reference range is required"),
              abnormalFlag: z.boolean().optional()
            })
          )
          .min(1, "At least one test parameter is required"),
        isCritical: z.boolean().optional()
      })
    )
    .min(1, "At least one test result entry is required")
});

const verifyResultSchema = z.object({
  status: z.enum(["REVIEWED", "RELEASED"])
});

export const getLabDashboard = async (
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

    const data = await getLabDashboardData(user.id, user.role, search, statusFilter);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getLabOrderById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { orderId } = req.params;
    if (!orderId) {
      return sendError(res, "BAD_REQUEST", "Order ID is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true }
    });

    if (!user || user.status !== "ACTIVE") {
      return sendError(res, "UNAUTHORIZED", "Active user profile required", 401);
    }

    const data = await getLabOrderDetails(user.id, user.role, orderId);
    return sendSuccess(res, data);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postCollectSample = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { orderId } = req.params;
    if (!orderId) {
      return sendError(res, "BAD_REQUEST", "Order ID is required", 400);
    }

    const parseResult = collectSampleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const updatedOrder = await collectLabSample(
      req.user.userId,
      orderId,
      parseResult.data.sampleId,
      parseResult.data.accessionId
    );

    return sendSuccess(res, updatedOrder);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postProcessOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { orderId } = req.params;
    if (!orderId) {
      return sendError(res, "BAD_REQUEST", "Order ID is required", 400);
    }

    const updatedOrder = await processLabOrder(req.user.userId, orderId);
    return sendSuccess(res, updatedOrder);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postRecordResults = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { orderId } = req.params;
    if (!orderId) {
      return sendError(res, "BAD_REQUEST", "Order ID is required", 400);
    }

    const parseResult = recordResultsSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const updatedOrder = await recordLabResults(req.user.userId, orderId, parseResult.data);
    return sendSuccess(res, updatedOrder, 201);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};

export const postVerifyResult = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    const { resultId } = req.params;
    if (!resultId) {
      return sendError(res, "BAD_REQUEST", "Result ID is required", 400);
    }

    const parseResult = verifyResultSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "BAD_REQUEST", parseResult.error.errors[0].message, 400);
    }

    const updatedResult = await verifyLabResult(req.user.userId, resultId, parseResult.data.status);
    return sendSuccess(res, updatedResult);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.code, error.message, error.statusCode);
    }
    next(error);
  }
};
