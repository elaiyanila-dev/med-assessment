import { Router } from "express";
import {
  getAppointmentsDashboard,
  getAppointmentById,
  postCreateAppointment,
  postRegisterAndBookAppointment,
  postCheckInAppointment,
  patchRescheduleAppointment,
  postMarkNoShow,
  postCancelAppointment
} from "../controllers/appointment.controller.js";
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
  getAppointmentsDashboard
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
  getAppointmentById
);

// Mutation Endpoints (Receptionist, Doctor, Admin Only)
router.post(
  "/",
  authorizeRoles(
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  postCreateAppointment
);

router.post(
  "/register-and-book",
  authorizeRoles(
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  postRegisterAndBookAppointment
);

router.post(
  "/:id/check-in",
  authorizeRoles(
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  postCheckInAppointment
);

router.patch(
  "/:id/reschedule",
  authorizeRoles(
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  patchRescheduleAppointment
);

router.post(
  "/:id/no-show",
  authorizeRoles(
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  postMarkNoShow
);

router.post(
  "/:id/cancel",
  authorizeRoles(
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  postCancelAppointment
);

export default router;
