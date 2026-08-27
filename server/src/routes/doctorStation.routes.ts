import { Router } from "express";
import { getPatientContext, getStationQueue } from "../controllers/doctorStation.controller.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN));

router.get("/patient/:patientId", getPatientContext);
router.get("/queue", getStationQueue);

export default router;
