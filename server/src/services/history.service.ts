import { prisma } from "../utils/prisma.js";
import { UserRole } from "@prisma/client";

export const searchPatientsForHistory = async (query?: string) => {
  const whereClause: any = {
    deletedAt: null
  };

  if (query && query.trim() !== "") {
    const term = query.trim();
    whereClause.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { UHID: { contains: term, mode: "insensitive" } },
      { mobile: { contains: term, mode: "insensitive" } }
    ];
  }

  const patients = await prisma.patient.findMany({
    where: whereClause,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      UHID: true,
      age: true,
      gender: true,
      mobile: true,
      bloodGroup: true,
      priority: true
    },
    take: 20
  });

  return patients;
};

export const getPatientHistoryDetails = async (
  userId: string,
  userRole: UserRole,
  patientId: string,
  filterType?: string
) => {
  // 1. Fetch Patient Record
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

  // 2. Doctor Patient-Level Authorization Scoping Verification
  if (userRole === UserRole.DOCTOR) {
    const hasRelation = await prisma.queueEntry.findFirst({
      where: { patientId, doctorId: userId }
    }) || await prisma.consultation.findFirst({
      where: { patientId, doctorId: userId }
    }) || await prisma.appointment.findFirst({
      where: { patientId, doctorId: userId }
    }) || await prisma.admission.findFirst({
      where: { patientId, doctorId: userId }
    });

    if (!hasRelation) {
      const err: any = new Error("Not authorized to access clinical history for patients outside physician care scope");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }
  }

  // 3. Fetch Activity Event Timeline with Explicit Event Type Mappings
  const timelineWhere: any = { patientId };
  if (filterType && filterType !== "ALL") {
    const upperFilter = filterType.toUpperCase();
    const explicitMappings: Record<string, string[]> = {
      CONSULTATIONS: ["CONSULTATION_STARTED", "CONSULTATION_NOTES_UPDATED", "CONSULTATION_COMPLETED"],
      VITALS: ["VITAL_RECORDED"],
      LABORATORY: [
        "LAB_ORDER_CREATED",
        "LAB_SAMPLE_COLLECTED",
        "LAB_PROCESSING_STARTED",
        "LAB_RESULT_READY",
        "LAB_CRITICAL_RESULT_RECORDED",
        "LAB_RESULT_REVIEWED",
        "LAB_RESULT_RELEASED"
      ],
      PRESCRIPTIONS: ["PRESCRIPTION_CREATED", "PHARMACY_DISPENSED"],
      APPOINTMENTS: [
        "APPOINTMENT_SCHEDULED",
        "APPOINTMENT_CHECKED_IN",
        "APPOINTMENT_RESCHEDULED",
        "APPOINTMENT_NO_SHOW",
        "APPOINTMENT_CANCELLED"
      ],
      PATIENT_ADMIN: [
        "PATIENT_REGISTERED",
        "PATIENT_UPDATED",
        "PATIENT_ALLERGY_ADDED",
        "PATIENT_ALLERGY_REMOVED",
        "PATIENT_CONDITION_ADDED",
        "PATIENT_CONDITION_UPDATED",
        "PATIENT_SOFT_DELETED"
      ]
    };

    if (explicitMappings[upperFilter]) {
      timelineWhere.eventType = { in: explicitMappings[upperFilter] };
    } else {
      timelineWhere.eventType = { contains: upperFilter, mode: "insensitive" };
    }
  }

  const timeline = await prisma.activityEvent.findMany({
    where: timelineWhere,
    orderBy: { timestamp: "desc" }
  });

  // 3. Fetch Consultations
  const consultations = await prisma.consultation.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: {
      doctor: {
        select: { id: true, name: true, role: true }
      },
      notes: true,
      prescriptions: {
        include: {
          items: {
            include: { medicine: true }
          }
        }
      }
    }
  });

  // 4. Fetch Vitals History
  const vitals = await prisma.vital.findMany({
    where: { patientId },
    orderBy: { recordedAt: "desc" },
    include: {
      recorder: {
        select: { id: true, name: true, role: true }
      }
    }
  });

  // 5. Fetch Prescriptions
  const prescriptions = await prisma.prescription.findMany({
    where: { patientId },
    orderBy: { prescribedAt: "desc" },
    include: {
      doctor: {
        select: { id: true, name: true, role: true }
      },
      items: {
        include: { medicine: true }
      }
    }
  });

  // 6. Fetch Lab Orders
  const labOrders = await prisma.labOrder.findMany({
    where: { patientId },
    orderBy: { orderTimestamp: "desc" },
    include: {
      doctor: {
        select: { id: true, name: true, role: true }
      },
      items: {
        include: { test: true }
      },
      results: true
    }
  });

  return {
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
        severity: a.severity
      })),
      conditions: patient.conditions.map((c) => ({
        id: c.id,
        condition: c.condition,
        status: c.status
      }))
    },
    timeline: timeline.map((ev) => ({
      id: ev.id,
      eventType: ev.eventType,
      description: ev.description,
      timestamp: ev.timestamp.toISOString(),
      metadata: ev.metadata
    })),
    consultations: consultations.map((c) => ({
      id: c.id,
      doctorName: c.doctor.name,
      status: c.status,
      startedAt: c.startedAt ? c.startedAt.toISOString() : null,
      finishedAt: c.finishedAt ? c.finishedAt.toISOString() : null,
      subjective: c.subjective,
      objective: c.objective,
      assessment: c.assessment,
      plan: c.plan,
      icd10Code: c.icd10Code,
      createdAt: c.createdAt.toISOString()
    })),
    vitals: vitals.map((v) => ({
      id: v.id,
      recordedBy: v.recorder.name,
      systolicBP: v.systolicBP,
      diastolicBP: v.diastolicBP,
      spo2: v.spo2,
      temperature: v.temperature,
      weight: v.weight,
      recordedAt: v.recordedAt.toISOString()
    })),
    prescriptions: prescriptions.map((p) => ({
      id: p.id,
      doctorName: p.doctor.name,
      status: p.status,
      prescribedAt: p.prescribedAt.toISOString(),
      items: p.items.map((i) => ({
        id: i.id,
        medicineName: i.medicine.name,
        genericName: i.medicine.genericName,
        dosage: i.dosage,
        frequency: i.frequency,
        durationDays: i.durationDays,
        quantity: i.quantity
      }))
    })),
    labOrders: labOrders.map((l) => ({
      id: l.id,
      doctorName: l.doctor.name,
      priority: l.priority,
      status: l.status,
      orderTimestamp: l.orderTimestamp.toISOString(),
      items: l.items.map((i) => ({
        id: i.id,
        testName: i.test.name,
        testCode: i.test.code,
        status: i.status
      }))
    }))
  };
};

export const getHistoryEventDetail = async (
  userId: string,
  userRole: UserRole,
  eventId: string
) => {
  const event = await prisma.activityEvent.findUnique({
    where: { id: eventId },
    include: { patient: true }
  });

  if (!event) {
    const err: any = new Error("History event record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  return event;
};
