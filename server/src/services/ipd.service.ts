import { prisma } from "../utils/prisma.js";
import { BedStatus, AdmissionStatus, WardRoundStatus, IPDIndentPriority, ReturnWasteType, UserRole } from "@prisma/client";

export const getIPDDashboardData = async () => {
  // 1. Fetch All Beds with Patients
  const beds = await prisma.bed.findMany({
    orderBy: { bedNumber: "asc" },
    include: {
      patient: {
        select: { id: true, name: true, UHID: true, age: true, gender: true, mobile: true }
      },
      admissions: {
        where: { status: AdmissionStatus.ACTIVE },
        take: 1,
        include: {
          doctor: { select: { id: true, name: true, role: true } }
        }
      }
    }
  });

  // 2. Fetch Active Admissions
  const activeAdmissions = await prisma.admission.findMany({
    where: { status: AdmissionStatus.ACTIVE },
    orderBy: { admittedAt: "desc" },
    include: {
      patient: true,
      bed: true,
      doctor: { select: { id: true, name: true, role: true } }
    }
  });

  // 3. Fetch Ward Rounds
  const wardRounds = await prisma.wardRound.findMany({
    orderBy: { scheduledAt: "desc" },
    take: 10,
    include: {
      patient: { select: { id: true, name: true, UHID: true } },
      doctor: { select: { id: true, name: true } },
      bed: { select: { id: true, bedNumber: true, ward: true } }
    }
  });

  // 4. Fetch IPD Indents
  const ipdIndents = await prisma.iPDIndent.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      patient: { select: { id: true, name: true, UHID: true } },
      bed: { select: { id: true, bedNumber: true, ward: true } },
      items: {
        include: { medicine: true }
      }
    }
  });

  // Calculate Bed Occupancy Metrics
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === BedStatus.OCCUPIED).length;
  const availableBeds = beds.filter((b) => b.status === BedStatus.AVAILABLE).length;
  const maintenanceBeds = beds.filter((b) => b.status === BedStatus.MAINTENANCE || b.status === BedStatus.CLEANING).length;

  // Group Beds by Ward
  const wardMap: Record<string, { ward: string; wardCode: string; totalBeds: number; occupiedBeds: number; availableBeds: number }> = {};
  for (const bed of beds) {
    const key = bed.ward;
    if (!wardMap[key]) {
      wardMap[key] = {
        ward: bed.ward,
        wardCode: bed.wardCode,
        totalBeds: 0,
        occupiedBeds: 0,
        availableBeds: 0
      };
    }
    wardMap[key].totalBeds += 1;
    if (bed.status === BedStatus.OCCUPIED) wardMap[key].occupiedBeds += 1;
    if (bed.status === BedStatus.AVAILABLE) wardMap[key].availableBeds += 1;
  }

  const wards = Object.values(wardMap);

  return {
    metrics: {
      totalBeds,
      occupiedBeds,
      availableBeds,
      maintenanceBeds,
      activeAdmissionsCount: activeAdmissions.length,
      occupancyPercentage: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
    },
    wards,
    beds: beds.map((b) => ({
      id: b.id,
      bedNumber: b.bedNumber,
      ward: b.ward,
      wardCode: b.wardCode,
      status: b.status,
      dailyRate: b.dailyRate,
      equipment: b.equipment,
      patient: b.patient,
      activeAdmission: b.admissions[0]
        ? {
            id: b.admissions[0].id,
            doctorName: b.admissions[0].doctor.name,
            admittedAt: b.admissions[0].admittedAt.toISOString(),
            reason: b.admissions[0].reason
          }
        : null
    })),
    admissions: activeAdmissions.map((a) => ({
      id: a.id,
      patientId: a.patient.id,
      patientName: a.patient.name,
      patientUHID: a.patient.UHID,
      patientAge: a.patient.age,
      patientGender: a.patient.gender,
      bedNumber: a.bed.bedNumber,
      ward: a.bed.ward,
      doctorName: a.doctor.name,
      admittedAt: a.admittedAt.toISOString(),
      reason: a.reason,
      status: a.status
    })),
    wardRounds: wardRounds.map((r) => ({
      id: r.id,
      patientName: r.patient.name,
      patientUHID: r.patient.UHID,
      doctorName: r.doctor.name,
      bedNumber: r.bed.bedNumber,
      ward: r.bed.ward,
      scheduledAt: r.scheduledAt.toISOString(),
      status: r.status,
      notes: r.notes
    })),
    ipdIndents: ipdIndents.map((i) => ({
      id: i.id,
      patientName: i.patient.name,
      patientUHID: i.patient.UHID,
      bedNumber: i.bed.bedNumber,
      ward: i.ward,
      priority: i.priority,
      status: i.status,
      createdAt: i.createdAt.toISOString(),
      items: i.items.map((item) => ({
        id: item.id,
        medicineName: item.medicine.name,
        dose: item.dose,
        quantity: item.quantity,
        packaging: item.packaging
      }))
    }))
  };
};

export const getAdmissionDetails = async (
  userId: string,
  userRole: UserRole,
  admissionId: string
) => {
  const admission = await prisma.admission.findUnique({
    where: { id: admissionId },
    include: {
      patient: {
        include: {
          allergies: true,
          conditions: true
        }
      },
      bed: true,
      doctor: { select: { id: true, name: true, role: true } }
    }
  });

  if (!admission) {
    const err: any = new Error("Admission record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  // Doctor Patient-Level Authorization Scoping Verification
  if (userRole === UserRole.DOCTOR && admission.doctorId !== userId) {
    const hasRelation = await prisma.queueEntry.findFirst({
      where: { patientId: admission.patientId, doctorId: userId }
    }) || await prisma.consultation.findFirst({
      where: { patientId: admission.patientId, doctorId: userId }
    }) || await prisma.appointment.findFirst({
      where: { patientId: admission.patientId, doctorId: userId }
    });

    if (!hasRelation) {
      const err: any = new Error("Not authorized to access admission clinical details for patients outside physician care scope");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }
  }

  // Fetch ward rounds for this admission's bed & patient
  const wardRounds = await prisma.wardRound.findMany({
    where: { patientId: admission.patientId },
    orderBy: { scheduledAt: "desc" },
    include: {
      doctor: { select: { id: true, name: true } }
    }
  });

  // Fetch IPD indents for this admission's bed & patient
  const indents = await prisma.iPDIndent.findMany({
    where: { patientId: admission.patientId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { medicine: true }
      }
    }
  });

  return {
    admission: {
      id: admission.id,
      patient: admission.patient,
      bed: admission.bed,
      doctor: admission.doctor,
      admittedAt: admission.admittedAt.toISOString(),
      dischargedAt: admission.dischargedAt ? admission.dischargedAt.toISOString() : null,
      status: admission.status,
      reason: admission.reason
    },
    wardRounds: wardRounds.map((r) => ({
      id: r.id,
      doctorName: r.doctor.name,
      scheduledAt: r.scheduledAt.toISOString(),
      status: r.status,
      notes: r.notes
    })),
    indents: indents.map((i) => ({
      id: i.id,
      ward: i.ward,
      priority: i.priority,
      status: i.status,
      createdAt: i.createdAt.toISOString(),
      items: i.items.map((item) => ({
        id: item.id,
        medicineName: item.medicine.name,
        dose: item.dose,
        quantity: item.quantity
      }))
    }))
  };
};

export const createWardRound = async (
  doctorId: string,
  data: {
    patientId: string;
    bedId: string;
    notes?: string | null;
    status?: WardRoundStatus;
  }
) => {
  // Validate patient & bed
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient || patient.deletedAt !== null) {
    const err: any = new Error("Patient record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  const bed = await prisma.bed.findUnique({ where: { id: data.bedId } });
  if (!bed) {
    const err: any = new Error("Bed record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Create Ward Round
    const wardRound = await tx.wardRound.create({
      data: {
        patientId: data.patientId,
        doctorId,
        bedId: data.bedId,
        scheduledAt: new Date(),
        status: data.status || WardRoundStatus.COMPLETED,
        notes: data.notes || "Standard IPD physician ward round completed."
      },
      include: {
        patient: true,
        bed: true
      }
    });

    // 2. Log AuditLog
    await tx.auditLog.create({
      data: {
        actorId: doctorId,
        action: "WARD_ROUND_CREATED",
        entityType: "WardRound",
        entityId: wardRound.id,
        metadata: {
          patientId: data.patientId,
          bedId: data.bedId,
          status: wardRound.status,
          notes: wardRound.notes
        }
      }
    });

    // 3. Log ActivityEvent for Patient History Integration
    await tx.activityEvent.create({
      data: {
        patientId: data.patientId,
        actorId: doctorId,
        actorType: "DOCTOR",
        eventType: "IPD_ROUND_LOGGED",
        timestamp: new Date(),
        department: "IPD",
        description: `Physician ward round completed in ${wardRound.bed.ward} (Bed ${wardRound.bed.bedNumber})`,
        metadata: {
          wardRoundId: wardRound.id,
          bedNumber: wardRound.bed.bedNumber,
          notes: wardRound.notes
        }
      }
    });

    return wardRound;
  });
};

export const createIPDIndent = async (
  actorId: string,
  data: {
    patientId: string;
    bedId: string;
    ward: string;
    priority?: IPDIndentPriority;
    items: Array<{ medicineId: string; dose: string; quantity: number; packaging?: string | null }>;
  }
) => {
  // Validate patient & bed
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient || patient.deletedAt !== null) {
    const err: any = new Error("Patient record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  const bed = await prisma.bed.findUnique({ where: { id: data.bedId } });
  if (!bed) {
    const err: any = new Error("Bed record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  // Validate medicines
  for (const item of data.items) {
    const medicine = await prisma.medicine.findUnique({ where: { id: item.medicineId } });
    if (!medicine || medicine.deletedAt !== null || medicine.status !== "ACTIVE") {
      const err: any = new Error(`Medicine record with ID ${item.medicineId} not found or inactive`);
      err.statusCode = 404;
      err.code = "NOT_FOUND";
      throw err;
    }
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Create IPD Indent + Items
    const indent = await tx.iPDIndent.create({
      data: {
        patientId: data.patientId,
        bedId: data.bedId,
        ward: data.ward,
        priority: data.priority || IPDIndentPriority.ROUTINE,
        status: "PENDING",
        items: {
          create: data.items.map((item) => ({
            medicineId: item.medicineId,
            dose: item.dose,
            quantity: item.quantity,
            packaging: item.packaging || "STRIP"
          }))
        }
      },
      include: {
        items: { include: { medicine: true } },
        patient: true,
        bed: true
      }
    });

    // 2. Log AuditLog
    await tx.auditLog.create({
      data: {
        actorId,
        action: "IPD_INDENT_CREATED",
        entityType: "IPDIndent",
        entityId: indent.id,
        metadata: {
          patientId: data.patientId,
          bedId: data.bedId,
          priority: indent.priority,
          itemsCount: indent.items.length
        }
      }
    });

    // 3. Log ActivityEvent for Patient History Integration
    await tx.activityEvent.create({
      data: {
        patientId: data.patientId,
        actorId,
        actorType: "STAFF",
        eventType: "IPD_INDENT_CREATED",
        timestamp: new Date(),
        department: "IPD_PHARMACY",
        description: `IPD medicine indent created for Bed ${indent.bed.bedNumber} (${indent.items.length} item(s))`,
        metadata: {
          indentId: indent.id,
          priority: indent.priority,
          medicines: indent.items.map((i) => i.medicine.name).join(", ")
        }
      }
    });

    return indent;
  });
};

export const createReturnWasteRecord = async (
  actorId: string,
  data: {
    patientId: string;
    bedId?: string | null;
    medicineId: string;
    quantity: number;
    type: ReturnWasteType;
    reason: string;
  }
) => {
  // Validate patient
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient || patient.deletedAt !== null) {
    const err: any = new Error("Patient record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  // Validate medicine
  const medicine = await prisma.medicine.findUnique({ where: { id: data.medicineId } });
  if (!medicine || medicine.deletedAt !== null || medicine.status !== "ACTIVE") {
    const err: any = new Error(`Medicine record with ID ${data.medicineId} not found or inactive`);
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Create ReturnWaste Record
    const record = await tx.returnWaste.create({
      data: {
        patientId: data.patientId,
        bedId: data.bedId || undefined,
        medicineId: data.medicineId,
        quantity: data.quantity,
        type: data.type,
        reason: data.reason,
        status: "PENDING"
      },
      include: {
        medicine: true,
        patient: true
      }
    });

    // 2. Log AuditLog
    await tx.auditLog.create({
      data: {
        actorId,
        action: "RETURN_WASTE_RECORDED",
        entityType: "ReturnWaste",
        entityId: record.id,
        metadata: {
          patientId: data.patientId,
          type: data.type,
          quantity: data.quantity,
          reason: data.reason
        }
      }
    });

    // 3. Log ActivityEvent for Patient History Integration
    await tx.activityEvent.create({
      data: {
        patientId: data.patientId,
        actorId,
        actorType: "STAFF",
        eventType: "IPD_RETURN_WASTE_LOGGED",
        timestamp: new Date(),
        department: "IPD_PHARMACY",
        description: `${data.type.replace(/_/g, " ")} recorded for ${record.medicine.name} (Qty: ${data.quantity})`,
        metadata: {
          returnWasteId: record.id,
          medicineName: record.medicine.name,
          quantity: data.quantity,
          reason: data.reason
        }
      }
    });

    return record;
  });
};

export const searchIPDMedicines = async (query?: string) => {
  const whereClause: any = { status: "ACTIVE", deletedAt: null };
  if (query && query.trim() !== "") {
    whereClause.OR = [
      { name: { contains: query.trim(), mode: "insensitive" } },
      { genericName: { contains: query.trim(), mode: "insensitive" } }
    ];
  }

  const medicines = await prisma.medicine.findMany({
    where: whereClause,
    orderBy: { name: "asc" },
    take: 20
  });

  return medicines;
};

export const createAdmissionRecord = async (
  actorId: string,
  actorRole: UserRole,
  data: {
    patientId: string;
    bedId: string;
    doctorId: string;
    reason: string;
  }
) => {
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient || patient.deletedAt !== null) {
    const err: any = new Error("Patient record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  const bed = await prisma.bed.findUnique({ where: { id: data.bedId } });
  if (!bed) {
    const err: any = new Error("Bed record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  // DOUBLE OCCUPANCY CHECK
  if (bed.status === BedStatus.OCCUPIED || bed.patientId !== null) {
    const err: any = new Error(`Bed ${bed.bedNumber} is currently OCCUPIED. Double occupancy is prohibited.`);
    err.statusCode = 409;
    err.code = "DOUBLE_OCCUPANCY_PROHIBITED";
    throw err;
  }

  if (bed.status === BedStatus.MAINTENANCE || bed.status === BedStatus.CLEANING) {
    const err: any = new Error(`Bed ${bed.bedNumber} is currently in ${bed.status} status and cannot receive admissions.`);
    err.statusCode = 400;
    err.code = "INVALID_BED_STATUS";
    throw err;
  }

  // Active admission check for patient
  const activeAdmission = await prisma.admission.findFirst({
    where: { patientId: data.patientId, status: AdmissionStatus.ACTIVE }
  });
  if (activeAdmission) {
    const err: any = new Error(`Patient ${patient.name} already has an active IPD admission.`);
    err.statusCode = 400;
    err.code = "ALREADY_ADMITTED";
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    const newAdmission = await tx.admission.create({
      data: {
        patientId: data.patientId,
        bedId: data.bedId,
        doctorId: data.doctorId,
        reason: data.reason,
        status: AdmissionStatus.ACTIVE,
        admittedAt: new Date()
      }
    });

    await tx.bed.update({
      where: { id: data.bedId },
      data: { status: BedStatus.OCCUPIED, patientId: data.patientId }
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "ADMISSION_CREATED",
        entityType: "Admission",
        entityId: newAdmission.id,
        metadata: { patientId: data.patientId, bedId: data.bedId, doctorId: data.doctorId }
      }
    });

    await tx.activityEvent.create({
      data: {
        patientId: data.patientId,
        actorId,
        actorType: actorRole,
        eventType: "IPD_ADMISSION",
        timestamp: new Date(),
        department: "IPD",
        description: `Admitted to IPD Bed ${bed.bedNumber} (${bed.ward})`
      }
    });

    return newAdmission;
  });
};

export const dischargeAdmissionRecord = async (
  actorId: string,
  actorRole: UserRole,
  admissionId: string
) => {
  const admission = await prisma.admission.findUnique({
    where: { id: admissionId },
    include: { bed: true }
  });

  if (!admission) {
    const err: any = new Error("Admission record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  if (admission.status === AdmissionStatus.DISCHARGED) {
    const err: any = new Error("Admission has already been discharged");
    err.statusCode = 400;
    err.code = "ALREADY_DISCHARGED";
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    const discharged = await tx.admission.update({
      where: { id: admissionId },
      data: {
        status: AdmissionStatus.DISCHARGED,
        dischargedAt: new Date()
      }
    });

    await tx.bed.update({
      where: { id: admission.bedId },
      data: { status: BedStatus.CLEANING, patientId: null }
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "PATIENT_DISCHARGED",
        entityType: "Admission",
        entityId: admissionId,
        metadata: { patientId: admission.patientId, bedId: admission.bedId }
      }
    });

    await tx.activityEvent.create({
      data: {
        patientId: admission.patientId,
        actorId,
        actorType: actorRole,
        eventType: "IPD_DISCHARGE",
        timestamp: new Date(),
        department: "IPD",
        description: "Patient discharged from IPD"
      }
    });

    return discharged;
  });
};

