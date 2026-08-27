import { prisma } from "../utils/prisma.js";
import { UserRole } from "@prisma/client";

export interface SelectedPatientContextResponse {
  queueEntry: {
    id: string;
    token: number | string;
    status: string;
    priority: string;
    source: string;
    arrivalTime: string;
  } | null;
  patient: {
    id: string;
    name: string;
    UHID: string;
    age?: number | null;
    gender: string;
    mobile: string;
    email?: string | null;
    bloodGroup?: string | null;
    address?: string | null;
    priority: string;
    allergies: Array<{ id: string; allergen: string; severity?: string | null; reaction?: string | null }>;
    conditions: Array<{ id: string; condition: string; status?: string | null; diagnosed?: string | null }>;
  };
  latestVitals?: {
    systolicBP?: number | null;
    diastolicBP?: number | null;
    spo2?: number | null;
    temperature?: number | null;
    weight?: number | null;
    recordedAt: string;
  } | null;
  recentTimeline: Array<{
    id: string;
    eventType: string;
    description: string;
    timestamp: string;
  }>;
}

export const getDoctorStationPatientContext = async (
  userId: string,
  userRole: UserRole,
  patientId: string,
  queueId?: string
): Promise<SelectedPatientContextResponse> => {
  // Authorization check: Only DOCTOR role can load physician patient station context
  if (userRole !== UserRole.DOCTOR) {
    const err: any = new Error("User role is not authorized for Doctor Station context");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  // 1. Verify Queue Entry if queueId supplied
  let queueEntry: any = null;
  if (queueId) {
    queueEntry = await prisma.queueEntry.findUnique({
      where: { id: queueId },
      include: { patient: true }
    });

    if (!queueEntry) {
      const err: any = new Error("Requested queue entry not found");
      err.statusCode = 404;
      err.code = "NOT_FOUND";
      throw err;
    }

    if (queueEntry.doctorId !== userId) {
      const err: any = new Error("Not authorized to access queue entry assigned to another physician");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }

    if (queueEntry.patientId !== patientId) {
      const err: any = new Error("Queue entry does not match the specified patient ID");
      err.statusCode = 400;
      err.code = "BAD_REQUEST";
      throw err;
    }
  } else {
    // Find active queue entry for this patient assigned to current doctor
    queueEntry = await prisma.queueEntry.findFirst({
      where: {
        patientId,
        doctorId: userId,
        status: { notIn: ["COMPLETED", "CANCELLED"] }
      },
      orderBy: { arrivalTime: "desc" }
    });
  }

  // 2. Query Patient Details
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      allergies: true,
      conditions: true
    }
  });

  if (!patient || patient.deletedAt !== null) {
    const err: any = new Error("Patient record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  // 3. Query Latest Vitals
  const latestVitalRecord = await prisma.vital.findFirst({
    where: { patientId },
    orderBy: { recordedAt: "desc" }
  });

  // 4. Query Recent Activity Events
  const recentEvents = await prisma.activityEvent.findMany({
    where: { patientId },
    orderBy: { timestamp: "desc" },
    take: 5
  });

  return {
    queueEntry: queueEntry
      ? {
          id: queueEntry.id,
          token: queueEntry.token,
          status: queueEntry.status,
          priority: queueEntry.priority,
          source: queueEntry.source,
          arrivalTime: queueEntry.arrivalTime.toISOString()
        }
      : null,
    patient: {
      id: patient.id,
      name: patient.name,
      UHID: patient.UHID,
      age: patient.age,
      gender: patient.gender,
      mobile: patient.mobile,
      email: patient.email,
      bloodGroup: patient.bloodGroup,
      address: patient.address,
      priority: patient.priority,
      allergies: patient.allergies.map((a) => ({
        id: a.id,
        allergen: a.allergen,
        severity: a.severity,
        reaction: a.reaction
      })),
      conditions: patient.conditions.map((c) => ({
        id: c.id,
        condition: c.condition,
        status: c.status,
        diagnosed: c.diagnosed ? c.diagnosed.toISOString() : null
      }))
    },
    latestVitals: latestVitalRecord
      ? {
          systolicBP: latestVitalRecord.systolicBP,
          diastolicBP: latestVitalRecord.diastolicBP,
          spo2: latestVitalRecord.spo2,
          temperature: latestVitalRecord.temperature,
          weight: latestVitalRecord.weight,
          recordedAt: latestVitalRecord.recordedAt.toISOString()
        }
      : null,
    recentTimeline: recentEvents.map((ev) => ({
      id: ev.id,
      eventType: ev.eventType,
      description: ev.description,
      timestamp: ev.timestamp.toISOString()
    }))
  };
};
