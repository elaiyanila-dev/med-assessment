import { Router } from "express";
import {
  searchPatients,
  getPatientHistory,
  getEventDetail
} from "../controllers/history.controller.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticateToken);
router.use(
  authorizeRoles(
    UserRole.DOCTOR,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.NURSE,
    UserRole.PATHOLOGIST,
    UserRole.PHARMACIST
  )
);

router.get("/patients", searchPatients);
router.get("/patient/:patientId", getPatientHistory);
router.get("/event/:eventId", getEventDetail);

export default router;
