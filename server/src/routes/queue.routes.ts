import { Router } from "express";
import { getQueue, updateStatus } from "../controllers/queue.controller.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN));

router.get("/", getQueue);
router.patch("/:id/status", updateStatus);

export default router;
