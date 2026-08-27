import { Router } from "express";
import {
  getPrescriptions,
  getPrescriptionById
} from "../controllers/prescription.controller.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticateToken);

router.get(
  "/",
  authorizeRoles(
    UserRole.DOCTOR,
    UserRole.PHARMACIST,
    UserRole.NURSE,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.RECEPTIONIST
  ),
  getPrescriptions
);

router.get(
  "/:id",
  authorizeRoles(
    UserRole.DOCTOR,
    UserRole.PHARMACIST,
    UserRole.NURSE,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.RECEPTIONIST
  ),
  getPrescriptionById
);

export default router;
