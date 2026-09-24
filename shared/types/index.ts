export enum UserRole {
  DOCTOR = "DOCTOR",
  NURSE = "NURSE",
  LAB_TECHNICIAN = "LAB_TECHNICIAN",
  PATHOLOGIST = "PATHOLOGIST",
  PHARMACIST = "PHARMACIST",
  RECEPTIONIST = "RECEPTIONIST",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN"
}

export enum QueueStatus {
  WAITING = "WAITING",
  CHECKED_IN = "CHECKED_IN",
  IN_CONSULTATION = "IN_CONSULTATION",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export enum QueueSource {
  CLINIC = "CLINIC",
  REMOTE = "REMOTE"
}

export enum ConsultationStatus {
  READY = "READY",
  IN_PROGRESS = "IN_PROGRESS",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED"
}

export enum PrescriptionStatus {
  DRAFT = "DRAFT",
  SENT_TO_PHARMACY = "SENT_TO_PHARMACY",
  DISPENSED = "DISPENSED",
  CANCELLED = "CANCELLED"
}

export enum PharmacyOrderStatus {
  PENDING_DISPENSE = "PENDING_DISPENSE",
  DISPENSED = "DISPENSED",
  CANCELLED = "CANCELLED"
}

export enum PharmacyTransactionType {
  DISPENSE = "DISPENSE",
  IPD_ISSUE = "IPD_ISSUE",
  RESTOCK = "RESTOCK",
  WASTAGE = "WASTAGE",
  STOCK_ADJUSTMENT = "STOCK_ADJUSTMENT"
}

export enum LabPriority {
  ROUTINE = "ROUTINE",
  STAT = "STAT"
}

export enum LabOrderStatus {
  ORDERED = "ORDERED",
  COLLECTED = "COLLECTED",
  PROCESSING = "PROCESSING",
  RESULT_READY = "RESULT_READY",
  CRITICAL = "CRITICAL",
  RELEASED = "RELEASED",
  CANCELLED = "CANCELLED"
}

export enum LabResultStatus {
  ENTERED = "ENTERED",
  REVIEWED = "REVIEWED",
  RELEASED = "RELEASED"
}

export enum BedStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
  CLEANING = "CLEANING",
  MAINTENANCE = "MAINTENANCE"
}

export enum AdmissionStatus {
  ACTIVE = "ACTIVE",
  DISCHARGED = "DISCHARGED"
}

export enum WardRoundStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export enum IPDIndentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  FULFILLED = "FULFILLED",
  CANCELLED = "CANCELLED"
}

export enum IPDIndentPriority {
  ROUTINE = "ROUTINE",
  STAT = "STAT"
}

export enum ReturnWasteType {
  RETURN_TO_PHARMACY = "RETURN_TO_PHARMACY",
  WASTAGE = "WASTAGE"
}

export enum ReturnWasteStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED"
}

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string | null;
}

export interface ApiError {
  code: string;
  message: string;
  requestId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface AuthenticatedUser extends UserPayload {
  phone?: string | null;
  specialization?: string | null;
  status?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthenticatedUser;
}

export interface CurrentUserResponse {
  user: AuthenticatedUser;
}

export interface DashboardAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientUHID: string;
  scheduledAt: string;
  status: string;
  type: string;
}

export interface DashboardResponseData {
  type?: "DOCTOR" | "ADMIN";
  greeting: string;
  stats: {
    myQueue: { count: number; highPriority: number };
    pendingReports: { count: number; ready: number };
    ipdRounds: { count: number; pending: number };
  };
  upcomingAppointments: DashboardAppointment[];
  commandCenter?: {
    totalWalkIns: number;
    activeInFacility: number;
    avgWaitMinutes: number;
    estimatedRevenue: number;
    highVolume: boolean;
  };
  flowPipeline?: Array<{
    label: string;
    count: number;
    capacity: number;
    status?: "busy" | "normal";
  }>;
  arrivalTrend?: Array<{ hour: string; count: number }>;
  departmentLoad?: Array<{
    department: string;
    count: number;
    load: "Critical Load" | "High Load" | "Normal Load";
  }>;
  resourceStatus?: {
    doctors: { active: number; total: number };
    beds: { occupied: number; total: number; percent: number };
  };
  revenueClassification?: Array<{ label: string; amount: number }>;
  patientClassification?: {
    total: number;
    new: number;
    returning: number;
    newPercent: number;
    returningPercent: number;
  };
}
