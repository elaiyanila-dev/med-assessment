import { Router } from "express";
import {
  getPharmacyDashboard,
  getPrescriptionById,
  getMedicines,
  postDispensePrescription
} from "../controllers/pharmacy.controller.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticateToken);

// Read Endpoints (Strictly READ-ONLY)
router.get(
  "/",
  authorizeRoles(
    UserRole.PHARMACIST,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  getPharmacyDashboard
);

router.get(
  "/prescriptions/:prescriptionId",
  authorizeRoles(
    UserRole.PHARMACIST,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  getPrescriptionById
);

router.get(
  "/medicines",
  authorizeRoles(
    UserRole.PHARMACIST,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  getMedicines
);

// Dispensing Mutation Endpoint (Pharmacist & Admin Only)
router.post(
  "/prescriptions/:prescriptionId/dispense",
  authorizeRoles(UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  postDispensePrescription
);

export default router;
