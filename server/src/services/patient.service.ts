import { prisma } from "../utils/prisma.js";
import { UserRole, AdmissionStatus, QueueStatus, ConsultationStatus } from "@prisma/client";

export const getPatientDirectoryData = async (
  userId: string,
  userRole: UserRole,
  query?: string,
  registrationTypeFilter?: string,
  bloodGroupFilter?: string,
  priorityFilter?: string,
  page: number = 1,
  limit: number = 20
) => {
  // STRICTLY READ-ONLY: No database writes
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

  if (registrationTypeFilter && registrationTypeFilter !== "ALL") {
    whereClause.registrationType = registrationTypeFilter;
  }

  if (bloodGroupFilter && bloodGroupFilter !== "ALL") {
    whereClause.bloodGroup = bloodGroupFilter;
  }

  if (priorityFilter && priorityFilter !== "ALL") {
    whereClause.priority = priorityFilter;
  }

  const skip = (page - 1) * limit;

  const [totalCount, patients] = await Promise.all([
    prisma.patient.count({ where: whereClause }),
    prisma.patient.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
      skip,
      take: limit,
      include: {
        allergies: true,
        conditions: true,
        admissions: {
          where: { status: AdmissionStatus.ACTIVE },
          include: { bed: true }
        },
        queueEntries: {
          where: { status: { in: [QueueStatus.WAITING, QueueStatus.CHECKED_IN, QueueStatus.IN_CONSULTATION] } }
        }
      }
    })
  ]);

  // Overall directory statistics
  const [totalRegistered, opdCount, ipdCount, emergencyCount] = await Promise.all([
    prisma.patient.count({ where: { deletedAt: null } }),
    prisma.patient.count({ where: { deletedAt: null, registrationType: "OPD" } }),
    prisma.patient.count({ where: { deletedAt: null, admissions: { some: { status: AdmissionStatus.ACTIVE } } } }),
    prisma.patient.count({ where: { deletedAt: null, priority: { in: ["HIGH", "URGENT", "EMERGENCY"] } } })
  ]);

  return {
    metrics: {
      totalRegistered,
      opdCount,
      ipdCount,
      emergencyCount
    },
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    },
    patients: patients.map((p) => ({
      id: p.id,
      name: p.name,
      UHID: p.UHID,
      age: p.age,
      gender: p.gender,
      mobile: p.mobile,
      email: p.email,
      bloodGroup: p.bloodGroup,
      address: p.address,
      priority: p.priority,
      registrationType: p.registrationType,
      department: p.department,
      allergiesCount: p.allergies.length,
      conditionsCount: p.conditions.length,
      activeAdmissionBed: p.admissions.length > 0 ? `${p.admissions[0].bed.ward} - Bed ${p.admissions[0].bed.bedNumber}` : null,
      activeQueueToken: p.queueEntries.length > 0 ? p.queueEntries[0].token : null,
      createdAt: p.createdAt.toISOString()
    }))
  };
};

export const getPatientProfileDetails = async (
  userId: string,
  userRole: UserRole,
  patientId: string
) => {
  // STRICTLY READ-ONLY
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      allergies: { orderBy: { createdAt: "desc" } },
      conditions: { orderBy: { createdAt: "desc" } },
      admissions: {
        orderBy: { admittedAt: "desc" },
        include: { bed: true, doctor: { select: { id: true, name: true } } }
      },
      queueEntries: {
        where: { status: { in: [QueueStatus.WAITING, QueueStatus.CHECKED_IN, QueueStatus.IN_CONSULTATION] } },
        include: { doctor: { select: { id: true, name: true } } }
      },
      consultations: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { doctor: { select: { id: true, name: true } } }
      },
      appointments: {
        orderBy: { scheduledAt: "desc" },
        take: 5,
        include: { doctor: { select: { id: true, name: true } } }
      }
    }
  });

  if (!patient || patient.deletedAt !== null) {
    const err: any = new Error("Patient profile record not found");
    err.statusCode = 404;
    err.code = "PATIENT_NOT_FOUND";
    throw err;
  }

  // Doctor Care-Scope Authorization Check
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
      const err: any = new Error("Not authorized to access patient clinical profile outside physician care scope");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }
  }

  return {
    id: patient.id,
    name: patient.name,
    UHID: patient.UHID,
    dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.toISOString() : null,
    age: patient.age,
    gender: patient.gender,
    mobile: patient.mobile,
    email: patient.email,
    bloodGroup: patient.bloodGroup,
    address: patient.address,
    priority: patient.priority,
    registrationType: patient.registrationType,
    department: patient.department,
    allergies: patient.allergies,
    conditions: patient.conditions,
    activeAdmission: patient.admissions.find((a) => a.status === AdmissionStatus.ACTIVE) || null,
    activeQueueEntry: patient.queueEntries[0] || null,
    recentConsultations: patient.consultations,
    recentAppointments: patient.appointments,
    createdAt: patient.createdAt.toISOString()
  };
};

export const createPatientRecord = async (
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
    department?: string;
  }
) => {
  const actor = await prisma.user.findUnique({ where: { id: actorId } });
  if (!actor || actor.status !== "ACTIVE") {
    const err: any = new Error("Active user authentication required");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Transaction Advisory Lock on Mobile & Global UHID Generator for CONCURRENCY PROTECTION
      const mobileLockKey = `patient_mobile_${payload.mobile}`;
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${mobileLockKey}));
      `;
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext('global_uhid_generator'));
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

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const totalCount = await tx.patient.count();
      const generatedUHID = `UHID-${dateStr}-${(totalCount + 1).toString().padStart(4, "0")}`;

      // Create Patient
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
          department: payload.department || "General"
        }
      });

      // AuditLog
      await tx.auditLog.create({
        data: {
          actorId,
          action: "PATIENT_REGISTERED",
          entityType: "Patient",
          entityId: patient.id,
          metadata: { UHID: generatedUHID, name: payload.name, mobile: payload.mobile }
        }
      });

      // ActivityEvent
      await tx.activityEvent.create({
        data: {
          patientId: patient.id,
          actorId,
          actorType: actor.role,
          eventType: "PATIENT_REGISTERED",
          timestamp: new Date(),
          department: payload.department || "REGISTRATION",
          description: `Patient profile registered (${generatedUHID})`,
          metadata: { UHID: generatedUHID }
        }
      });

      return patient;
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

export const updatePatientDemographics = async (
  actorId: string,
  actorRole: UserRole,
  patientId: string,
  payload: {
    name?: string;
    gender?: string;
    mobile?: string;
    email?: string;
    age?: number;
    bloodGroup?: string;
    address?: string;
    priority?: string;
    department?: string;
  }
) => {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient || patient.deletedAt !== null) {
    const err: any = new Error("Patient profile record not found");
    err.statusCode = 404;
    err.code = "PATIENT_NOT_FOUND";
    throw err;
  }

  // Doctor Care-Scope Check
  if (actorRole === UserRole.DOCTOR) {
    const hasRelation = await prisma.queueEntry.findFirst({
      where: { patientId, doctorId: actorId }
    }) || await prisma.consultation.findFirst({
      where: { patientId, doctorId: actorId }
    }) || await prisma.appointment.findFirst({
      where: { patientId, doctorId: actorId }
    }) || await prisma.admission.findFirst({
      where: { patientId, doctorId: actorId }
    });

    if (!hasRelation) {
      const err: any = new Error("Not authorized to update demographics for patient outside care scope");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }
  }

  return await prisma.$transaction(async (tx) => {
    const updatedPatient = await tx.patient.update({
      where: { id: patientId },
      data: {
        name: payload.name ?? patient.name,
        gender: payload.gender ?? patient.gender,
        mobile: payload.mobile ?? patient.mobile,
        email: payload.email !== undefined ? payload.email : patient.email,
        age: payload.age !== undefined ? payload.age : patient.age,
        bloodGroup: payload.bloodGroup !== undefined ? payload.bloodGroup : patient.bloodGroup,
        address: payload.address !== undefined ? payload.address : patient.address,
        priority: payload.priority ?? patient.priority,
        department: payload.department ?? patient.department
      }
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "PATIENT_DEMOGRAPHICS_UPDATED",
        entityType: "Patient",
        entityId: patientId,
        metadata: { updatedFields: Object.keys(payload) }
      }
    });

    await tx.activityEvent.create({
      data: {
        patientId,
        actorId,
        actorType: actorRole,
        eventType: "PATIENT_UPDATED",
        timestamp: new Date(),
        department: "REGISTRATION",
        description: `Patient demographic records updated by ${actorRole}`,
        metadata: { updatedFields: Object.keys(payload) }
      }
    });

    return updatedPatient;
  });
};

export const addPatientAllergy = async (
  actorId: string,
  actorRole: UserRole,
  patientId: string,
  payload: { allergen: string; severity?: string; reaction?: string }
) => {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient || patient.deletedAt !== null) {
    const err: any = new Error("Patient profile record not found");
    err.statusCode = 404;
    err.code = "PATIENT_NOT_FOUND";
    throw err;
  }

  // Doctor Care-Scope Check
  if (actorRole === UserRole.DOCTOR) {
    const hasRelation = await prisma.queueEntry.findFirst({
      where: { patientId, doctorId: actorId }
    }) || await prisma.consultation.findFirst({
      where: { patientId, doctorId: actorId }
    }) || await prisma.appointment.findFirst({
      where: { patientId, doctorId: actorId }
    }) || await prisma.admission.findFirst({
      where: { patientId, doctorId: actorId }
    });

    if (!hasRelation) {
      const err: any = new Error("Not authorized to add allergy alert for patient outside care scope");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }
  }

  return await prisma.$transaction(async (tx) => {
    const allergy = await tx.patientAllergy.create({
      data: {
        patientId,
        allergen: payload.allergen,
        severity: payload.severity || "MODERATE",
        reaction: payload.reaction || null
      }
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "PATIENT_ALLERGY_ADDED",
        entityType: "PatientAllergy",
        entityId: allergy.id,
        metadata: { patientId, allergen: payload.allergen, severity: payload.severity }
      }
    });

    await tx.activityEvent.create({
      data: {
        patientId,
        actorId,
        actorType: actorRole,
        eventType: "PATIENT_ALLERGY_ADDED",
        timestamp: new Date(),
        department: "CLINICAL_SAFETY",
        description: `New allergy alert added: ${payload.allergen} (${payload.severity || "MODERATE"})`,
        metadata: { allergyId: allergy.id, allergen: payload.allergen }
      }
    });

    return allergy;
  });
};

export const removePatientAllergy = async (
  actorId: string,
  actorRole: UserRole,
  patientId: string,
  allergyId: string
) => {
  const allergy = await prisma.patientAllergy.findUnique({ where: { id: allergyId } });
  if (!allergy || allergy.patientId !== patientId) {
    // IDOR Protection
    const err: any = new Error("Target allergy record not found for this patient");
    err.statusCode = 404;
    err.code = "ALLERGY_NOT_FOUND";
    throw err;
  }

  // Doctor Care-Scope Check
  if (actorRole === UserRole.DOCTOR) {
    const hasRelation = await prisma.queueEntry.findFirst({
      where: { patientId, doctorId: actorId }
    }) || await prisma.consultation.findFirst({
      where: { patientId, doctorId: actorId }
    }) || await prisma.appointment.findFirst({
      where: { patientId, doctorId: actorId }
    }) || await prisma.admission.findFirst({
      where: { patientId, doctorId: actorId }
    });

    if (!hasRelation) {
      const err: any = new Error("Not authorized to remove allergy alert for patient outside care scope");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }
  }

  return await prisma.$transaction(async (tx) => {
    await tx.patientAllergy.delete({ where: { id: allergyId } });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "PATIENT_ALLERGY_REMOVED",
        entityType: "PatientAllergy",
        entityId: allergyId,
        metadata: { patientId, allergen: allergy.allergen }
      }
    });

    await tx.activityEvent.create({
      data: {
        patientId,
        actorId,
        actorType: actorRole,
        eventType: "PATIENT_ALLERGY_REMOVED",
        timestamp: new Date(),
        department: "CLINICAL_SAFETY",
        description: `Allergy alert removed: ${allergy.allergen}`,
        metadata: { allergyId, allergen: allergy.allergen }
      }
    });

    return { success: true, removedAllergyId: allergyId };
  });
};

export const addPatientCondition = async (
  actorId: string,
  actorRole: UserRole,
  patientId: string,
  payload: { condition: string; status?: string; diagnosed?: string }
) => {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient || patient.deletedAt !== null) {
    const err: any = new Error("Patient profile record not found");
    err.statusCode = 404;
    err.code = "PATIENT_NOT_FOUND";
    throw err;
  }

  // Doctor Care-Scope Check
  if (actorRole === UserRole.DOCTOR) {
    const hasRelation = await prisma.queueEntry.findFirst({
      where: { patientId, doctorId: actorId }
    }) || await prisma.consultation.findFirst({
      where: { patientId, doctorId: actorId }
    }) || await prisma.appointment.findFirst({
      where: { patientId, doctorId: actorId }
    }) || await prisma.admission.findFirst({
      where: { patientId, doctorId: actorId }
    });

    if (!hasRelation) {
      const err: any = new Error("Not authorized to add medical condition for patient outside care scope");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }
  }

  const diagnosedDate = payload.diagnosed ? new Date(payload.diagnosed) : new Date();

  return await prisma.$transaction(async (tx) => {
    const condition = await tx.patientCondition.create({
      data: {
        patientId,
        condition: payload.condition,
        status: payload.status || "ACTIVE",
        diagnosed: diagnosedDate
      }
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "PATIENT_CONDITION_ADDED",
        entityType: "PatientCondition",
        entityId: condition.id,
        metadata: { patientId, condition: payload.condition, status: payload.status }
      }
    });

    await tx.activityEvent.create({
      data: {
        patientId,
        actorId,
        actorType: actorRole,
        eventType: "PATIENT_CONDITION_ADDED",
        timestamp: new Date(),
        department: "CLINICAL_SUMMARY",
        description: `New chronic condition recorded: ${payload.condition}`,
        metadata: { conditionId: condition.id, condition: payload.condition }
      }
    });

    return condition;
  });
};

export const updatePatientCondition = async (
  actorId: string,
  actorRole: UserRole,
  patientId: string,
  conditionId: string,
  payload: { status: string }
) => {
  const condition = await prisma.patientCondition.findUnique({ where: { id: conditionId } });
  if (!condition || condition.patientId !== patientId) {
    // IDOR Protection
    const err: any = new Error("Target medical condition record not found for this patient");
    err.statusCode = 404;
    err.code = "CONDITION_NOT_FOUND";
    throw err;
  }

  // Doctor Care-Scope Check
  if (actorRole === UserRole.DOCTOR) {
    const hasRelation = await prisma.queueEntry.findFirst({
      where: { patientId, doctorId: actorId }
    }) || await prisma.consultation.findFirst({
      where: { patientId, doctorId: actorId }
    }) || await prisma.appointment.findFirst({
      where: { patientId, doctorId: actorId }
    }) || await prisma.admission.findFirst({
      where: { patientId, doctorId: actorId }
    });

    if (!hasRelation) {
      const err: any = new Error("Not authorized to update medical condition for patient outside care scope");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }
  }

  return await prisma.$transaction(async (tx) => {
    const updatedCondition = await tx.patientCondition.update({
      where: { id: conditionId },
      data: { status: payload.status }
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "PATIENT_CONDITION_UPDATED",
        entityType: "PatientCondition",
        entityId: conditionId,
        metadata: { patientId, condition: condition.condition, oldStatus: condition.status, newStatus: payload.status }
      }
    });

    await tx.activityEvent.create({
      data: {
        patientId,
        actorId,
        actorType: actorRole,
        eventType: "PATIENT_CONDITION_UPDATED",
        timestamp: new Date(),
        department: "CLINICAL_SUMMARY",
        description: `Medical condition status updated to ${payload.status} (${condition.condition})`,
        metadata: { conditionId, newStatus: payload.status }
      }
    });

    return updatedCondition;
  });
};

export const softDeletePatient = async (
  actorId: string,
  actorRole: UserRole,
  patientId: string,
  reason?: string
) => {
  if (actorRole !== UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
    const err: any = new Error("Administrative role required to delete patient profile records");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient || patient.deletedAt !== null) {
    const err: any = new Error("Patient profile record not found");
    err.statusCode = 404;
    err.code = "PATIENT_NOT_FOUND";
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Check Active Admission Protection
    const activeAdmission = await tx.admission.findFirst({
      where: { patientId, status: AdmissionStatus.ACTIVE }
    });

    if (activeAdmission) {
      const err: any = new Error("Cannot delete patient record with an active IPD bed admission");
      err.statusCode = 400;
      err.code = "ACTIVE_ADMISSION_EXISTS";
      throw err;
    }

    // 2. Check Active Queue Protection
    const activeQueue = await tx.queueEntry.findFirst({
      where: {
        patientId,
        status: { in: [QueueStatus.WAITING, QueueStatus.CHECKED_IN, QueueStatus.IN_CONSULTATION] }
      }
    });

    if (activeQueue) {
      const err: any = new Error("Cannot delete patient record with an active waiting or in-consultation queue entry");
      err.statusCode = 400;
      err.code = "ACTIVE_QUEUE_EXISTS";
      throw err;
    }

    // 3. Check Active Consultation Protection
    const activeConsultation = await tx.consultation.findFirst({
      where: {
        patientId,
        status: { in: [ConsultationStatus.READY, ConsultationStatus.IN_PROGRESS, ConsultationStatus.ON_HOLD] }
      }
    });

    if (activeConsultation) {
      const err: any = new Error("Cannot delete patient record with an active open consultation");
      err.statusCode = 400;
      err.code = "ACTIVE_CONSULTATION_EXISTS";
      throw err;
    }

    // Execute Soft Delete
    const updatedPatient = await tx.patient.update({
      where: { id: patientId },
      data: { deletedAt: new Date() }
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "PATIENT_SOFT_DELETED",
        entityType: "Patient",
        entityId: patientId,
        metadata: { reason: reason || "Admin soft delete" }
      }
    });

    await tx.activityEvent.create({
      data: {
        patientId,
        actorId,
        actorType: actorRole,
        eventType: "PATIENT_SOFT_DELETED",
        timestamp: new Date(),
        department: "ADMINISTRATION",
        description: `Patient profile soft-deleted by administrator`,
        metadata: { reason }
      }
    });

    return updatedPatient;
  });
};
