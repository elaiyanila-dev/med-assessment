import { Router } from "express";
import {
  getIPDDashboard,
  getAdmissionById,
  postWardRound,
  postIPDIndent,
  postReturnWaste,
  searchMedicines,
  postAdmitPatient,
  postDischargePatient
} from "../controllers/ipd.controller.js";
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
    UserRole.PHARMACIST
  )
);

router.get("/", getIPDDashboard);
router.get("/admissions/:admissionId", getAdmissionById);
router.post("/admissions", postAdmitPatient);
router.post("/admissions/:admissionId/discharge", postDischargePatient);
router.post("/ward-rounds", postWardRound);
router.post("/indents", postIPDIndent);
router.post("/return-waste", postReturnWaste);
router.get("/medicines", searchMedicines);

export default router;

