import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { sendSuccess, sendError } from "../utils/response.js";
import {
  getPrescriptionList,
  getPrescriptionDetails
} from "../services/prescription.service.js";

export const getPrescriptions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status, patientId, doctorId, startDate, endDate, page, limit } = req.query;

    const data = await getPrescriptionList({
      search: search as string,
      status: status as string,
      patientId: patientId as string,
      doctorId: doctorId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      userId: req.user?.userId,
      userRole: req.user?.role
    });

    return sendSuccess(res, data, 200);
  } catch (error: any) {
    return sendError(res, "PRESCRIPTION_FETCH_ERROR", error.message || "Failed to fetch prescriptions list", 500);
  }
};

export const getPrescriptionById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendError(res, "VALIDATION_ERROR", "Prescription ID parameter is required", 400);
    }

    const prescription = await getPrescriptionDetails(id);

    if (!prescription) {
      return sendError(res, "NOT_FOUND", "Prescription record not found", 404);
    }

    return sendSuccess(res, prescription, 200);
  } catch (error: any) {
    return sendError(res, "PRESCRIPTION_FETCH_ERROR", error.message || "Failed to fetch prescription details", 500);
  }
};
