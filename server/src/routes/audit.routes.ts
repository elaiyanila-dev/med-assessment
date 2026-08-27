import { Router } from "express";
import { getAuditLogs } from "../controllers/audit.controller.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN));

router.get("/", getAuditLogs);

export default router;
