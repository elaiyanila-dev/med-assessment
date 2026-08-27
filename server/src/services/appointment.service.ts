import { prisma } from "../utils/prisma.js";
import {
  UserRole,
  QueueStatus,
  QueueSource
} from "@prisma/client";

export const getAppointmentsDashboardData = async (
  userId: string,
  userRole: UserRole,
  query?: string,
  statusFilter?: string,
  dateStr?: string
) => {
  // STRICTLY READ-ONLY: No database writes
  const appointmentWhere: any = {};

  if (userRole === UserRole.DOCTOR) {
    appointmentWhere.OR = [
      { doctorId: userId },
      {
        patient: {
          queueEntries: { some: { doctorId: userId } }
        }
      },
      {
        patient: {
          consultations: { some: { doctorId: userId } }
        }
      }
    ];
  }

  if (query && query.trim() !== "") {
    const term = query.trim();
    appointmentWhere.AND = [
      {
        OR: [
          { id: { contains: term, mode: "insensitive" } },
          { patient: { name: { contains: term, mode: "insensitive" } } },
          { patient: { UHID: { contains: term, mode: "insensitive" } } },
          { doctor: { name: { contains: term, mode: "insensitive" } } },
          { department: { contains: term, mode: "insensitive" } }
        ]
      }
    ];
  }

  if (statusFilter && statusFilter !== "ALL") {
    appointmentWhere.status = statusFilter;
  }

  if (dateStr) {
    const targetDate = new Date(dateStr);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    appointmentWhere.scheduledAt = {
      gte: startOfDay,
      lte: endOfDay
    };
  }

  // Fetch Appointments
  const appointments = await prisma.appointment.findMany({
    where: appointmentWhere,
    orderBy: { scheduledAt: "asc" },
    include: {
      patient: {
        select: { id: true, name: true, UHID: true, age: true, gender: true, mobile: true }
      },
      doctor: {
        select: { id: true, name: true, role: true, department: true }
      }
    }
  });

  // Calculate Metrics (READ-ONLY across unscoped or scoped appointments)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayAppointments = await prisma.appointment.findMany({
    where: {
      ...(userRole === UserRole.DOCTOR ? { doctorId: userId } : {}),
      scheduledAt: { gte: todayStart, lte: todayEnd }
    },
    select: { status: true }
  });

  const totalAppointmentsToday = todayAppointments.length;
  const pendingCheckIns = todayAppointments.filter((a) => a.status === "SCHEDULED" || a.status === "UPCOMING").length;
  const checkedInCount = todayAppointments.filter((a) => a.status === "CHECKED_IN").length;
  const noShowCount = todayAppointments.filter((a) => a.status === "NO_SHOW" || a.status === "CANCELLED").length;

  return {
    metrics: {
      totalAppointmentsToday,
      pendingCheckIns,
      checkedInCount,
      noShowCount
    },
    appointments: appointments.map((a) => ({
      id: a.id,
      patientId: a.patient.id,
      patientName: a.patient.name,
      patientUHID: a.patient.UHID,
      patientAge: a.patient.age,
      patientGender: a.patient.gender,
      patientMobile: a.patient.mobile,
      doctorId: a.doctor.id,
      doctorName: a.doctor.name,
      department: a.department,
      type: a.type,
      scheduledAt: a.scheduledAt.toISOString(),
      status: a.status
    }))
  };
};

export const getAppointmentDetails = async (
  userId: string,
  userRole: UserRole,
  appointmentId: string
) => {
  // STRICTLY READ-ONLY
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: {
        include: { allergies: true, conditions: true }
      },
      doctor: { select: { id: true, name: true, role: true, department: true } }
    }
  });

  if (!appointment) {
    const err: any = new Error("Appointment record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  // Doctor Care-Scoping Check
  if (userRole === UserRole.DOCTOR && appointment.doctorId !== userId) {
    const hasRelation = await prisma.queueEntry.findFirst({
      where: { patientId: appointment.patientId, doctorId: userId }
    }) || await prisma.consultation.findFirst({
      where: { patientId: appointment.patientId, doctorId: userId }
    });

    if (!hasRelation) {
      const err: any = new Error("Not authorized to access appointment details outside physician care scope");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }
  }

  return {
    id: appointment.id,
    patient: appointment.patient,
    doctor: appointment.doctor,
    department: appointment.department,
    type: appointment.type,
    scheduledAt: appointment.scheduledAt.toISOString(),
    status: appointment.status,
    createdAt: appointment.createdAt.toISOString()
  };
};

export const createAppointment = async (
  actorId: string,
  payload: {
    patientId: string;
    doctorId: string;
    department: string;
    type?: string;
    scheduledAt: string;
  }
) => {
  const scheduledTime = new Date(payload.scheduledAt);
  if (isNaN(scheduledTime.getTime()) || scheduledTime <= new Date()) {
    const err: any = new Error("Appointment date/time must be in the future");
    err.statusCode = 400;
    err.code = "INVALID_SCHEDULE_TIME";
    throw err;
  }

  const actor = await prisma.user.findUnique({ where: { id: actorId } });
  if (!actor || actor.status !== "ACTIVE") {
    const err: any = new Error("Active user authentication required");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  // Doctor Authorization Scoping Check
  if (actor.role === UserRole.DOCTOR && actor.id !== payload.doctorId) {
    const err: any = new Error("Physicians cannot create appointments for other doctors");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  // Verify patient existence
  const patient = await prisma.patient.findUnique({ where: { id: payload.patientId } });
  if (!patient || patient.deletedAt !== null) {
    const err: any = new Error("Target patient record not found");
    err.statusCode = 404;
    err.code = "PATIENT_NOT_FOUND";
    throw err;
  }

  // Verify doctor existence
  const doctor = await prisma.user.findUnique({ where: { id: payload.doctorId } });
  if (!doctor || doctor.role !== UserRole.DOCTOR || doctor.status !== "ACTIVE") {
    const err: any = new Error("Target physician is invalid or inactive");
    err.statusCode = 400;
    err.code = "INVALID_PHYSICIAN";
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    // Transaction Advisory Lock on Doctor Slot for CONCURRENCY PROTECTION
    const slotLockKey = `doctor_slot_${payload.doctorId}_${scheduledTime.toISOString()}`;
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${slotLockKey}));
    `;

    // Slot Collision Check inside transaction
    const existingSlot = await tx.appointment.findFirst({
      where: {
        doctorId: payload.doctorId,
        scheduledAt: scheduledTime,
        status: { in: ["SCHEDULED", "UPCOMING"] }
      }
    });

    if (existingSlot) {
      const err: any = new Error(`Physician ${doctor.name} already has a scheduled appointment at ${scheduledTime.toLocaleTimeString()}`);
      err.statusCode = 409;
      err.code = "SLOT_UNAVAILABLE";
      throw err;
    }

    const appointment = await tx.appointment.create({
      data: {
        patientId: payload.patientId,
        doctorId: payload.doctorId,
        department: payload.department || doctor.department || "General",
        type: payload.type || "ROUTINE",
        scheduledAt: scheduledTime,
        status: "SCHEDULED"
      },
      include: { patient: true, doctor: true }
    });

    // AuditLog
    await tx.auditLog.create({
      data: {
        actorId,
        action: "APPOINTMENT_CREATED",
        entityType: "Appointment",
        entityId: appointment.id,
        metadata: {
          patientId: payload.patientId,
          doctorId: payload.doctorId,
          scheduledAt: scheduledTime.toISOString()
        }
      }
    });

    // ActivityEvent
    await tx.activityEvent.create({
      data: {
        patientId: payload.patientId,
        actorId,
        actorType: actor.role,
        eventType: "APPOINTMENT_SCHEDULED",
        timestamp: new Date(),
        department: payload.department || doctor.department || "APPOINTMENTS",
        description: `Appointment scheduled with Dr. ${doctor.name} for ${scheduledTime.toLocaleString()}`,
        metadata: {
          appointmentId: appointment.id,
          doctorId: payload.doctorId,
          scheduledAt: scheduledTime.toISOString()
        }
      }
    });

    return appointment;
  });
};

export const registerPatientAndBookAppointment = async (
  actorId: string,
  payload: {
    name: string;
    gender: string;
    mobile: string;
    email?: string;
    age?: number;
    bloodGroup?: string;
    address?: string;
    priority?: string;
    doctorId: string;
    department: string;
    type?: string;
    scheduledAt: string;
  }
) => {
  const scheduledTime = new Date(payload.scheduledAt);
  if (isNaN(scheduledTime.getTime()) || scheduledTime <= new Date()) {
    const err: any = new Error("Appointment date/time must be in the future");
    err.statusCode = 400;
    err.code = "INVALID_SCHEDULE_TIME";
    throw err;
  }

  const actor = await prisma.user.findUnique({ where: { id: actorId } });
  if (!actor || actor.status !== "ACTIVE") {
    const err: any = new Error("Active user authentication required");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  // Doctor Authorization Scoping Check
  if (actor.role === UserRole.DOCTOR && actor.id !== payload.doctorId) {
    const err: any = new Error("Physicians cannot register and book appointments for other doctors");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  // Verify doctor existence
  const doctor = await prisma.user.findUnique({ where: { id: payload.doctorId } });
  if (!doctor || doctor.role !== UserRole.DOCTOR || doctor.status !== "ACTIVE") {
    const err: any = new Error("Target physician is invalid or inactive");
    err.statusCode = 400;
    err.code = "INVALID_PHYSICIAN";
    throw err;
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  try {
    return await prisma.$transaction(async (tx) => {
      // Transaction Advisory Lock on Mobile for CONCURRENCY PROTECTION
      const mobileLockKey = `patient_mobile_${payload.mobile}`;
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${mobileLockKey}));
      `;

      // Check existing duplicate mobile inside transaction
      const existingPatient = await tx.patient.findFirst({
        where: { mobile: payload.mobile, deletedAt: null }
      });

      if (existingPatient) {
        const err: any = new Error(`Patient with mobile ${payload.mobile} already exists (UHID: ${existingPatient.UHID})`);
        err.statusCode = 409;
        err.code = "DUPLICATE_PATIENT_RECORD";
        throw err;
      }

      // Lock doctor slot inside transaction
      const slotLockKey = `doctor_slot_${payload.doctorId}_${scheduledTime.toISOString()}`;
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${slotLockKey}));
      `;

      const existingSlot = await tx.appointment.findFirst({
        where: {
          doctorId: payload.doctorId,
          scheduledAt: scheduledTime,
          status: { in: ["SCHEDULED", "UPCOMING"] }
        }
      });

      if (existingSlot) {
        const err: any = new Error(`Physician ${doctor.name} already has a scheduled appointment at ${scheduledTime.toLocaleTimeString()}`);
        err.statusCode = 409;
        err.code = "SLOT_UNAVAILABLE";
        throw err;
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedUHID = `UHID-${dateStr}-${randomSuffix}`;

      // 1. Create Patient
      const patient = await tx.patient.create({
        data: {
          name: payload.name,
          UHID: generatedUHID,
          gender: payload.gender,
          mobile: payload.mobile,
          email: payload.email || null,
          age: payload.age || null,
          bloodGroup: payload.bloodGroup || null,
          address: payload.address || null,
          priority: payload.priority || "NORMAL",
          registrationType: "OPD",
          department: payload.department || doctor.department || "General"
        }
      });

      // 2. Create Appointment
      const appointment = await tx.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: payload.doctorId,
          department: payload.department || doctor.department || "General",
          type: payload.type || "ROUTINE",
          scheduledAt: scheduledTime,
          status: "SCHEDULED"
        },
        include: { patient: true, doctor: true }
      });

      // 3. AuditLog
      await tx.auditLog.create({
        data: {
          actorId,
          action: "PATIENT_REGISTERED_AND_BOOKED",
          entityType: "Patient",
          entityId: patient.id,
          metadata: {
            UHID: generatedUHID,
            appointmentId: appointment.id,
            doctorId: payload.doctorId
          }
        }
      });

      // 4. ActivityEvent
      await tx.activityEvent.create({
        data: {
          patientId: patient.id,
          actorId,
          actorType: actor.role,
          eventType: "APPOINTMENT_SCHEDULED",
          timestamp: new Date(),
          department: "APPOINTMENTS",
          description: `Patient registered (${generatedUHID}) and appointment booked with Dr. ${doctor.name}`,
          metadata: {
            appointmentId: appointment.id,
            doctorId: payload.doctorId,
            scheduledAt: scheduledTime.toISOString()
          }
        }
      });

      return { patient, appointment };
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      const err: any = new Error("Patient registration failed due to duplicate UHID or contact record");
      err.statusCode = 409;
      err.code = "DUPLICATE_PATIENT_RECORD";
      throw err;
    }
    throw error;
  }
};

export const checkInAppointmentToQueue = async (
  actorId: string,
  appointmentId: string,
  payload?: { priority?: string; source?: QueueSource }
) => {
  const actor = await prisma.user.findUnique({ where: { id: actorId } });
  if (!actor || actor.status !== "ACTIVE") {
    const err: any = new Error("Active user authentication required");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    // Lock Appointment for CONCURRENCY PROTECTION
    const apptLockKey = `appt_lock_${appointmentId}`;
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${apptLockKey}));
    `;

    // Re-query Appointment status INSIDE transaction
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true }
    });

    if (!appointment) {
      const err: any = new Error("Appointment record not found");
      err.statusCode = 404;
      err.code = "NOT_FOUND";
      throw err;
    }

    // Doctor Authorization Scoping Check
    if (actor.role === UserRole.DOCTOR && actor.id !== appointment.doctorId) {
      const err: any = new Error("Physicians cannot check in appointments assigned to other doctors");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }

    if (appointment.status !== "SCHEDULED" && appointment.status !== "UPCOMING") {
      const err: any = new Error(`Cannot check in appointment in status ${appointment.status}. Expected SCHEDULED.`);
      err.statusCode = 409;
      err.code = "ALREADY_CHECKED_IN";
      throw err;
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    // PostgreSQL Advisory Lock on Doctor Queue for CONCURRENCY PROTECTION
    const doctorQueueLockKey = `doctor_queue_${appointment.doctorId}_${todayStr}`;
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${doctorQueueLockKey}));
    `;

    // Check if patient already has an active queue entry
    const existingQueue = await tx.queueEntry.findFirst({
      where: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        status: { in: [QueueStatus.WAITING, QueueStatus.CHECKED_IN, QueueStatus.IN_CONSULTATION] }
      }
    });

    if (existingQueue) {
      const err: any = new Error(`Patient ${appointment.patient.name} already has an active queue entry (Token #${existingQueue.token})`);
      err.statusCode = 409;
      err.code = "ALREADY_IN_QUEUE";
      throw err;
    }

    // Calculate next token sequentially for this doctor today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const maxTokenResult = await tx.queueEntry.aggregate({
      where: {
        doctorId: appointment.doctorId,
        arrivalTime: { gte: startOfDay }
      },
      _max: { token: true }
    });

    const nextToken = (maxTokenResult._max.token || 0) + 1;

    // Create QueueEntry
    const queueEntry = await tx.queueEntry.create({
      data: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        token: nextToken,
        arrivalTime: new Date(),
        status: QueueStatus.WAITING,
        priority: payload?.priority || appointment.patient.priority || "ROUTINE",
        source: payload?.source || QueueSource.CLINIC
      }
    });

    // Update Appointment status to CHECKED_IN
    const updatedAppointment = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: "CHECKED_IN" }
    });

    // Update Patient queueStatus
    await tx.patient.update({
      where: { id: appointment.patientId },
      data: { queueStatus: "WAITING" }
    });

    // AuditLog
    await tx.auditLog.create({
      data: {
        actorId,
        action: "APPOINTMENT_CHECKED_IN",
        entityType: "Appointment",
        entityId: appointmentId,
        metadata: {
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          queueEntryId: queueEntry.id,
          token: nextToken
        }
      }
    });

    // ActivityEvent
    await tx.activityEvent.create({
      data: {
        patientId: appointment.patientId,
        actorId,
        actorType: actor.role,
        eventType: "APPOINTMENT_CHECKED_IN",
        timestamp: new Date(),
        department: "APPOINTMENTS",
        description: `Patient checked in to consultation queue for Dr. ${appointment.doctor.name} (Token #${nextToken})`,
        metadata: {
          appointmentId,
          queueEntryId: queueEntry.id,
          token: nextToken
        }
      }
    });

    return {
      appointment: updatedAppointment,
      queueEntry
    };
  });
};

export const rescheduleAppointment = async (
  actorId: string,
  appointmentId: string,
  payload: { scheduledAt: string; reason?: string }
) => {
  const newScheduledTime = new Date(payload.scheduledAt);
  if (isNaN(newScheduledTime.getTime()) || newScheduledTime <= new Date()) {
    const err: any = new Error("New appointment date/time must be in the future");
    err.statusCode = 400;
    err.code = "INVALID_SCHEDULE_TIME";
    throw err;
  }

  const actor = await prisma.user.findUnique({ where: { id: actorId } });
  if (!actor || actor.status !== "ACTIVE") {
    const err: any = new Error("Active user authentication required");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    // Lock Appointment for CONCURRENCY PROTECTION
    const apptLockKey = `appt_lock_${appointmentId}`;
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${apptLockKey}));
    `;

    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true }
    });

    if (!appointment) {
      const err: any = new Error("Appointment record not found");
      err.statusCode = 404;
      err.code = "NOT_FOUND";
      throw err;
    }

    // Doctor Authorization Scoping Check
    if (actor.role === UserRole.DOCTOR && actor.id !== appointment.doctorId) {
      const err: any = new Error("Physicians cannot reschedule appointments assigned to other doctors");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }

    if (appointment.status !== "SCHEDULED" && appointment.status !== "UPCOMING") {
      const err: any = new Error(`Cannot reschedule appointment in status ${appointment.status}. Only SCHEDULED appointments can be rescheduled.`);
      err.statusCode = 400;
      err.code = "INVALID_APPOINTMENT_STATE";
      throw err;
    }

    // Slot Lock for CONCURRENCY PROTECTION
    const slotLockKey = `doctor_slot_${appointment.doctorId}_${newScheduledTime.toISOString()}`;
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${slotLockKey}));
    `;

    // Slot availability check inside transaction
    const slotConflict = await tx.appointment.findFirst({
      where: {
        doctorId: appointment.doctorId,
        scheduledAt: newScheduledTime,
        status: { in: ["SCHEDULED", "UPCOMING"] },
        id: { not: appointmentId }
      }
    });

    if (slotConflict) {
      const err: any = new Error(`Physician Dr. ${appointment.doctor.name} already has a scheduled appointment at ${newScheduledTime.toLocaleString()}`);
      err.statusCode = 409;
      err.code = "SLOT_UNAVAILABLE";
      throw err;
    }

    const updatedAppointment = await tx.appointment.update({
      where: { id: appointmentId },
      data: { scheduledAt: newScheduledTime }
    });

    // AuditLog
    await tx.auditLog.create({
      data: {
        actorId,
        action: "APPOINTMENT_RESCHEDULED",
        entityType: "Appointment",
        entityId: appointmentId,
        metadata: {
          oldScheduledAt: appointment.scheduledAt.toISOString(),
          newScheduledAt: newScheduledTime.toISOString(),
          reason: payload.reason || "Patient requested"
        }
      }
    });

    // ActivityEvent
    await tx.activityEvent.create({
      data: {
        patientId: appointment.patientId,
        actorId,
        actorType: actor.role,
        eventType: "APPOINTMENT_RESCHEDULED",
        timestamp: new Date(),
        department: "APPOINTMENTS",
        description: `Appointment rescheduled to ${newScheduledTime.toLocaleString()} with Dr. ${appointment.doctor.name}`,
        metadata: {
          appointmentId,
          oldScheduledAt: appointment.scheduledAt.toISOString(),
          newScheduledAt: newScheduledTime.toISOString()
        }
      }
    });

    return updatedAppointment;
  });
};

export const markAppointmentNoShow = async (
  actorId: string,
  appointmentId: string
) => {
  const actor = await prisma.user.findUnique({ where: { id: actorId } });
  if (!actor || actor.status !== "ACTIVE") {
    const err: any = new Error("Active user authentication required");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    // Lock Appointment for CONCURRENCY PROTECTION
    const apptLockKey = `appt_lock_${appointmentId}`;
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${apptLockKey}));
    `;

    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true }
    });

    if (!appointment) {
      const err: any = new Error("Appointment record not found");
      err.statusCode = 404;
      err.code = "NOT_FOUND";
      throw err;
    }

    // Doctor Authorization Scoping Check
    if (actor.role === UserRole.DOCTOR && actor.id !== appointment.doctorId) {
      const err: any = new Error("Physicians cannot mark no-show for appointments assigned to other doctors");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }

    if (appointment.status !== "SCHEDULED" && appointment.status !== "UPCOMING") {
      const err: any = new Error(`Cannot mark appointment as NO_SHOW from status ${appointment.status}.`);
      err.statusCode = 400;
      err.code = "INVALID_APPOINTMENT_STATE";
      throw err;
    }

    const updatedAppointment = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: "NO_SHOW" }
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "APPOINTMENT_MARKED_NO_SHOW",
        entityType: "Appointment",
        entityId: appointmentId,
        metadata: { patientId: appointment.patientId }
      }
    });

    await tx.activityEvent.create({
      data: {
        patientId: appointment.patientId,
        actorId,
        actorType: actor.role,
        eventType: "APPOINTMENT_NO_SHOW",
        timestamp: new Date(),
        department: "APPOINTMENTS",
        description: `Patient marked as NO_SHOW for scheduled appointment with Dr. ${appointment.doctor.name}`,
        metadata: { appointmentId }
      }
    });

    return updatedAppointment;
  });
};

export const cancelAppointment = async (
  actorId: string,
  appointmentId: string,
  reason?: string
) => {
  const actor = await prisma.user.findUnique({ where: { id: actorId } });
  if (!actor || actor.status !== "ACTIVE") {
    const err: any = new Error("Active user authentication required");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    // Lock Appointment for CONCURRENCY PROTECTION
    const apptLockKey = `appt_lock_${appointmentId}`;
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${apptLockKey}));
    `;

    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true }
    });

    if (!appointment) {
      const err: any = new Error("Appointment record not found");
      err.statusCode = 404;
      err.code = "NOT_FOUND";
      throw err;
    }

    // Doctor Authorization Scoping Check
    if (actor.role === UserRole.DOCTOR && actor.id !== appointment.doctorId) {
      const err: any = new Error("Physicians cannot cancel appointments assigned to other doctors");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }

    if (appointment.status !== "SCHEDULED" && appointment.status !== "UPCOMING") {
      const err: any = new Error(`Cannot cancel appointment in status ${appointment.status}.`);
      err.statusCode = 400;
      err.code = "INVALID_APPOINTMENT_STATE";
      throw err;
    }

    const updatedAppointment = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED" }
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "APPOINTMENT_CANCELLED",
        entityType: "Appointment",
        entityId: appointmentId,
        metadata: { patientId: appointment.patientId, reason: reason || "Cancelled by user" }
      }
    });

    await tx.activityEvent.create({
      data: {
        patientId: appointment.patientId,
        actorId,
        actorType: actor.role,
        eventType: "APPOINTMENT_CANCELLED",
        timestamp: new Date(),
        department: "APPOINTMENTS",
        description: `Appointment with Dr. ${appointment.doctor.name} was cancelled`,
        metadata: { appointmentId, reason }
      }
    });

    return updatedAppointment;
  });
};
