import { Router } from "express";
import {
  getLabDashboard,
  getLabOrderById,
  postCollectSample,
  postProcessOrder,
  postRecordResults,
  postVerifyResult
} from "../controllers/lab.controller.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticateToken);

// Read Endpoints
router.get(
  "/",
  authorizeRoles(
    UserRole.LAB_TECHNICIAN,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  getLabDashboard
);

router.get(
  "/orders/:orderId",
  authorizeRoles(
    UserRole.LAB_TECHNICIAN,
    UserRole.PATHOLOGIST,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  getLabOrderById
);

// Lab Technician / Pathologist Mutation Endpoints
router.post(
  "/orders/:orderId/collect",
  authorizeRoles(UserRole.LAB_TECHNICIAN, UserRole.PATHOLOGIST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  postCollectSample
);

router.post(
  "/orders/:orderId/process",
  authorizeRoles(UserRole.LAB_TECHNICIAN, UserRole.PATHOLOGIST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  postProcessOrder
);

router.post(
  "/orders/:orderId/results",
  authorizeRoles(UserRole.LAB_TECHNICIAN, UserRole.PATHOLOGIST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  postRecordResults
);

// Pathologist Result Verification / Release Endpoint
router.post(
  "/results/:resultId/verify",
  authorizeRoles(UserRole.PATHOLOGIST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  postVerifyResult
);

export default router;
