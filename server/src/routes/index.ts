import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import queueRoutes from "./queue.routes.js";
import doctorStationRoutes from "./doctorStation.routes.js";
import consultationRoutes from "./consultation.routes.js";
import historyRoutes from "./history.routes.js";
import ipdRoutes from "./ipd.routes.js";
import labRoutes from "./lab.routes.js";
import pharmacyRoutes from "./pharmacy.routes.js";
import appointmentRoutes from "./appointment.routes.js";
import patientRoutes from "./patient.routes.js";
import userRoutes from "./user.routes.js";
import auditRoutes from "./audit.routes.js";
import emergencyRoutes from "./emergency.routes.js";
import prescriptionRoutes from "./prescription.routes.js";

const router = Router();

// Active Application Routes
router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/queue", queueRoutes);
router.use("/doctor-station", doctorStationRoutes);
router.use("/consultations", consultationRoutes);
router.use("/history", historyRoutes);
router.use("/ipd", ipdRoutes);
router.use("/laboratory", labRoutes);
router.use("/pharmacy", pharmacyRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/patients", patientRoutes);
router.use("/users", userRoutes);
router.use("/audit", auditRoutes);
router.use("/emergency", emergencyRoutes);
router.use("/prescriptions", prescriptionRoutes);

export default router;


