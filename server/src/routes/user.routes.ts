import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";
import {
  getDirectory,
  getUserById,
  postCreateUser,
  patchUpdateDemographics,
  patchUpdateStatus,
  postResetPassword,
  deleteUser
} from "../controllers/user.controller.js";

const router = Router();

router.use(authenticateToken);

// Paginated Staff Directory
router.get(
  "/",
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  getDirectory
);

// Staff Profile Details
router.get(
  "/:id",
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  getUserById
);

// Staff Account Creation
router.post(
  "/",
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  postCreateUser
);

// Staff Demographic Updating
router.patch(
  "/:id",
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  patchUpdateDemographics
);

// Account Status Management
router.patch(
  "/:id/status",
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  patchUpdateStatus
);

// Admin Password Reset
router.post(
  "/:id/reset-password",
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  postResetPassword
);

// Controlled Soft Delete (SUPER_ADMIN ONLY)
router.delete(
  "/:id",
  authorizeRoles(UserRole.SUPER_ADMIN),
  deleteUser
);

export default router;
