import { Router } from "express";
import {
  getConsultationSession,
  postStartConsultation,
  postVitals,
  patchNotes,
  getMedicines,
  postPrescription,
  getLabTests,
  postLabOrders,
  postFinish
} from "../controllers/consultation.controller.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN));

router.post("/start", postStartConsultation);
router.get("/active/:patientId", getConsultationSession);
router.post("/:id/vitals", postVitals);
router.patch("/:id/notes", patchNotes);
router.get("/medicines", getMedicines);
router.post("/:id/prescriptions", postPrescription);
router.get("/lab-tests", getLabTests);
router.post("/:id/lab-orders", postLabOrders);
router.post("/:id/finish", postFinish);

export default router;
