import { Router } from "express";
import { getDashboard } from "../controllers/dashboard.controller.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.get(
  "/",
  authenticateToken,
  authorizeRoles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  getDashboard
);

export default router;
