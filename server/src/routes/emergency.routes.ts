import { Router } from "express";
import { postEmergencyOverride, getEmergencyLogs } from "../controllers/emergency.controller.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticateToken);

// Emergency Override Execution (DOCTOR, ADMIN, SUPER_ADMIN)
router.post(
  "/override",
  authorizeRoles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  postEmergencyOverride
);

// Emergency Override Logs (ADMIN, SUPER_ADMIN)
router.get(
  "/logs",
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  getEmergencyLogs
);

export default router;
