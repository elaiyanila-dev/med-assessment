import { Router } from "express";
import {
  getPatientDirectory,
  getPatientById,
  postCreatePatient,
  patchUpdatePatientDemographics,
  postAddAllergy,
  deleteRemoveAllergy,
  postAddCondition,
  patchUpdateCondition,
  deleteSoftDeletePatient
} from "../controllers/patient.controller.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticateToken);

// Read Endpoints (Strictly READ-ONLY)
router.get(
  "/",
  authorizeRoles(
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  getPatientDirectory
);

router.get(
  "/:id",
  authorizeRoles(
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  getPatientById
);

// Patient Registration (Receptionist, Admin, Super Admin)
router.post(
  "/",
  authorizeRoles(
    UserRole.RECEPTIONIST,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  postCreatePatient
);

// Update Demographics (Receptionist, Doctor, Nurse, Admin)
router.patch(
  "/:id",
  authorizeRoles(
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  patchUpdatePatientDemographics
);

// Clinical Safety Flags: Allergies & Conditions (Doctor, Nurse, Admin)
router.post(
  "/:id/allergies",
  authorizeRoles(
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  postAddAllergy
);

router.delete(
  "/:id/allergies/:allergyId",
  authorizeRoles(
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  deleteRemoveAllergy
);

router.post(
  "/:id/conditions",
  authorizeRoles(
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  postAddCondition
);

router.patch(
  "/:id/conditions/:conditionId",
  authorizeRoles(
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  patchUpdateCondition
);

// Soft Delete (Admin & Super Admin Only)
router.delete(
  "/:id",
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  deleteSoftDeletePatient
);

export default router;
