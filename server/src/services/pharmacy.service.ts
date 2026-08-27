import { prisma } from "../utils/prisma.js";
import {
  PrescriptionStatus,
  PharmacyOrderStatus,
  PharmacyTransactionType,
  UserRole
} from "@prisma/client";

export const getPharmacyDashboardData = async (
  userId: string,
  userRole: UserRole,
  query?: string,
  statusFilter?: string
) => {
  // STRICTLY READ-ONLY: No database writes (No INSERT, UPDATE, DELETE)
  const prescriptionWhere: any = {};

  if (userRole === UserRole.DOCTOR) {
    prescriptionWhere.OR = [
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
      },
      {
        patient: {
          admissions: { some: { doctorId: userId } }
        }
      }
    ];
  }

  if (query && query.trim() !== "") {
    const term = query.trim();
    prescriptionWhere.AND = [
      {
        OR: [
          { id: { contains: term, mode: "insensitive" } },
          { patient: { name: { contains: term, mode: "insensitive" } } },
          { patient: { UHID: { contains: term, mode: "insensitive" } } },
          { items: { some: { medicine: { name: { contains: term, mode: "insensitive" } } } } }
        ]
      }
    ];
  }

  if (statusFilter && statusFilter !== "ALL") {
    prescriptionWhere.status = statusFilter as PrescriptionStatus;
  }

  // Fetch Prescriptions
  const prescriptions = await prisma.prescription.findMany({
    where: prescriptionWhere,
    orderBy: { prescribedAt: "desc" },
    include: {
      patient: {
        select: { id: true, name: true, UHID: true, age: true, gender: true, mobile: true }
      },
      doctor: {
        select: { id: true, name: true, role: true }
      },
      items: {
        include: { medicine: true }
      },
      pharmacyOrders: {
        include: { transactions: true }
      }
    }
  });

  // Calculate Metrics (READ-ONLY across unscoped or scoped prescriptions)
  const allPrescriptions = await prisma.prescription.findMany({
    where: userRole === UserRole.DOCTOR ? { doctorId: userId } : {},
    select: { status: true }
  });

  const allMedicines = await prisma.medicine.findMany({
    select: { stockQuantity: true, minimumStock: true, status: true, expiryDate: true }
  });

  const now = new Date();
  const totalRequisitions = allPrescriptions.length;
  const pendingDispense = allPrescriptions.filter(
    (p) => p.status === PrescriptionStatus.SENT_TO_PHARMACY || p.status === PrescriptionStatus.PENDING
  ).length;
  const dispensedToday = allPrescriptions.filter((p) => p.status === PrescriptionStatus.DISPENSED).length;
  const lowStockAlerts = allMedicines.filter(
    (m) => m.stockQuantity <= m.minimumStock || m.status === "LOW_STOCK" || m.status === "EXPIRED" || m.expiryDate <= now
  ).length;

  return {
    metrics: {
      totalRequisitions,
      pendingDispense,
      dispensedToday,
      lowStockAlerts
    },
    prescriptions: prescriptions.map((p) => ({
      id: p.id,
      patientId: p.patient.id,
      patientName: p.patient.name,
      patientUHID: p.patient.UHID,
      patientAge: p.patient.age,
      patientGender: p.patient.gender,
      doctorName: p.doctor.name,
      status: p.status,
      prescribedAt: p.prescribedAt.toISOString(),
      pharmacyOrder: p.pharmacyOrders[0]
        ? {
            id: p.pharmacyOrders[0].id,
            status: p.pharmacyOrders[0].status,
            dispensedAt: p.pharmacyOrders[0].dispensedAt ? p.pharmacyOrders[0].dispensedAt.toISOString() : null
          }
        : null,
      items: p.items.map((i) => ({
        id: i.id,
        medicineId: i.medicineId,
        medicineName: i.medicine.name,
        dosage: i.dosage,
        frequency: i.frequency,
        durationDays: i.durationDays,
        prescribedQuantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
        rackLocation: i.medicine.rackLocation,
        stockQuantity: i.medicine.stockQuantity,
        medicineStatus: i.medicine.status
      }))
    }))
  };
};

export const getPrescriptionDetails = async (
  userId: string,
  userRole: UserRole,
  prescriptionId: string
) => {
  // STRICTLY READ-ONLY: No database writes
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      patient: {
        include: { allergies: true, conditions: true }
      },
      doctor: { select: { id: true, name: true, role: true } },
      items: { include: { medicine: true } },
      pharmacyOrders: { include: { transactions: true } }
    }
  });

  if (!prescription) {
    const err: any = new Error("Prescription record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  // Doctor Patient-Level Authorization Scoping Check
  if (userRole === UserRole.DOCTOR && prescription.doctorId !== userId) {
    const hasRelation = await prisma.queueEntry.findFirst({
      where: { patientId: prescription.patientId, doctorId: userId }
    }) || await prisma.consultation.findFirst({
      where: { patientId: prescription.patientId, doctorId: userId }
    }) || await prisma.appointment.findFirst({
      where: { patientId: prescription.patientId, doctorId: userId }
    }) || await prisma.admission.findFirst({
      where: { patientId: prescription.patientId, doctorId: userId }
    });

    if (!hasRelation) {
      const err: any = new Error("Not authorized to access prescription records outside physician care scope");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }
  }

  // Calculate per-item dispensed and remaining quantities using referenceId = item.id
  const now = new Date();
  const itemsWithAccounting = await Promise.all(
    prescription.items.map(async (item) => {
      const pastTransactions = await prisma.pharmacyTransaction.findMany({
        where: { referenceId: item.id, type: PharmacyTransactionType.DISPENSE }
      });

      const dispensedQuantity = pastTransactions.reduce((acc, t) => acc + t.quantity, 0);
      const remainingQuantity = Math.max(0, item.quantity - dispensedQuantity);

      const isExpired = item.medicine.expiryDate <= now || item.medicine.status === "EXPIRED";
      const isInactive = item.medicine.status === "INACTIVE" || item.medicine.deletedAt !== null;

      return {
        id: item.id,
        medicineId: item.medicineId,
        medicineName: item.medicine.name,
        dosage: item.dosage,
        frequency: item.frequency,
        durationDays: item.durationDays,
        prescribedQuantity: item.quantity,
        dispensedQuantity,
        remainingQuantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        rackLocation: item.medicine.rackLocation,
        stockQuantity: item.medicine.stockQuantity,
        minimumStock: item.medicine.minimumStock,
        medicineStatus: item.medicine.status,
        expiryDate: item.medicine.expiryDate.toISOString(),
        isExpired,
        isInactive
      };
    })
  );

  return {
    id: prescription.id,
    patient: prescription.patient,
    doctor: prescription.doctor,
    status: prescription.status,
    prescribedAt: prescription.prescribedAt.toISOString(),
    pharmacyOrder: prescription.pharmacyOrders[0]
      ? {
          id: prescription.pharmacyOrders[0].id,
          status: prescription.pharmacyOrders[0].status,
          dispensedAt: prescription.pharmacyOrders[0].dispensedAt ? prescription.pharmacyOrders[0].dispensedAt.toISOString() : null
        }
      : null,
    items: itemsWithAccounting
  };
};

export const getMedicineCatalog = async (query?: string) => {
  // STRICTLY READ-ONLY
  const whereClause: any = { deletedAt: null };

  if (query && query.trim() !== "") {
    const term = query.trim();
    whereClause.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { genericName: { contains: term, mode: "insensitive" } },
      { category: { contains: term, mode: "insensitive" } },
      { rackLocation: { contains: term, mode: "insensitive" } }
    ];
  }

  const medicines = await prisma.medicine.findMany({
    where: whereClause,
    orderBy: { name: "asc" }
  });

  const now = new Date();

  return medicines.map((m) => ({
    id: m.id,
    name: m.name,
    genericName: m.genericName,
    category: m.category,
    manufacturer: m.manufacturer,
    rackLocation: m.rackLocation,
    unit: m.unit,
    stockQuantity: m.stockQuantity,
    minimumStock: m.minimumStock,
    unitPrice: m.unitPrice,
    expiryDate: m.expiryDate.toISOString(),
    status: m.status,
    isLowStock: m.stockQuantity <= m.minimumStock || m.status === "LOW_STOCK",
    isExpired: m.expiryDate <= now || m.status === "EXPIRED"
  }));
};

export const dispensePrescription = async (
  actorId: string,
  prescriptionId: string,
  payload: {
    items: Array<{
      prescriptionItemId: string;
      quantity: number;
    }>;
  }
) => {
  // Validate prescription existence
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      patient: true,
      items: { include: { medicine: true } },
      pharmacyOrders: true
    }
  });

  if (!prescription) {
    const err: any = new Error("Prescription record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  if (prescription.status === PrescriptionStatus.CANCELLED) {
    const err: any = new Error("Cannot dispense a cancelled prescription");
    err.statusCode = 400;
    err.code = "CANCELLED_PRESCRIPTION";
    throw err;
  }

  if (prescription.status === PrescriptionStatus.DISPENSED) {
    const err: any = new Error("Prescription has already been fully dispensed");
    err.statusCode = 400;
    err.code = "ALREADY_DISPENSED";
    throw err;
  }

  const seenItemIds = new Set<string>();
  for (const item of payload.items) {
    if (seenItemIds.has(item.prescriptionItemId)) {
      const err: any = new Error(`Duplicate prescription item ID ${item.prescriptionItemId} in request payload`);
      err.statusCode = 400;
      err.code = "DUPLICATE_ITEM_IN_PAYLOAD";
      throw err;
    }
    seenItemIds.add(item.prescriptionItemId);
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Ensure PharmacyOrder exists (lazy-created inside dispense transaction ONLY if missing)
    let pharmacyOrder = await tx.pharmacyOrder.findFirst({
      where: { prescriptionId }
    });

    const totalPrescriptionAmount = prescription.items.reduce((acc, i) => acc + i.totalPrice, 0);

    if (!pharmacyOrder) {
      pharmacyOrder = await tx.pharmacyOrder.create({
        data: {
          prescriptionId,
          patientId: prescription.patientId,
          status: PharmacyOrderStatus.PENDING_DISPENSE,
          totalAmount: totalPrescriptionAmount
        }
      });
    }

    const now = new Date();
    const itemMap = new Map(prescription.items.map((i) => [i.id, i]));

    for (const reqItem of payload.items) {
      const prescItem = itemMap.get(reqItem.prescriptionItemId);
      if (!prescItem) {
        const err: any = new Error(`Prescription item ID ${reqItem.prescriptionItemId} does not belong to prescription ${prescriptionId}`);
        err.statusCode = 400;
        err.code = "INVALID_ITEM_BELONGING";
        throw err;
      }

      if (reqItem.quantity <= 0) {
        const err: any = new Error(`Dispense quantity for medication ${prescItem.medicine.name} must be greater than zero`);
        err.statusCode = 400;
        err.code = "INVALID_QUANTITY";
        throw err;
      }

      // Calculate past dispensed for this specific item using referenceId = prescItem.id
      const pastTxns = await tx.pharmacyTransaction.findMany({
        where: { referenceId: prescItem.id, type: PharmacyTransactionType.DISPENSE }
      });
      const pastDispensed = pastTxns.reduce((acc, t) => acc + t.quantity, 0);
      const remainingQty = Math.max(0, prescItem.quantity - pastDispensed);

      if (reqItem.quantity > remainingQty) {
        const err: any = new Error(`Dispense quantity (${reqItem.quantity}) exceeds remaining prescribed quantity (${remainingQty}) for ${prescItem.medicine.name}`);
        err.statusCode = 400;
        err.code = "EXCEEDS_REMAINING_QUANTITY";
        throw err;
      }

      // Check Expiry & Inactive status
      if (prescItem.medicine.expiryDate <= now || prescItem.medicine.status === "EXPIRED") {
        const err: any = new Error(`Cannot dispense expired medication ${prescItem.medicine.name}`);
        err.statusCode = 400;
        err.code = "MEDICINE_EXPIRED";
        throw err;
      }

      if (prescItem.medicine.status === "INACTIVE" || prescItem.medicine.deletedAt !== null) {
        const err: any = new Error(`Cannot dispense inactive medication ${prescItem.medicine.name}`);
        err.statusCode = 400;
        err.code = "MEDICINE_INACTIVE";
        throw err;
      }

      // Atomic conditional stock deduction via PostgreSQL executeRaw
      const updatedRows: number = await tx.$executeRaw`
        UPDATE "Medicine"
        SET "stockQuantity" = "stockQuantity" - ${reqItem.quantity},
            "status" = CASE WHEN ("stockQuantity" - ${reqItem.quantity}) <= "minimumStock" THEN 'LOW_STOCK' ELSE "status" END,
            "updatedAt" = NOW()
        WHERE "id" = ${prescItem.medicineId}
          AND "stockQuantity" >= ${reqItem.quantity}
          AND "status" != 'INACTIVE'
          AND "deletedAt" IS NULL
      `;

      if (updatedRows === 0) {
        const err: any = new Error(`Insufficient stock for medication ${prescItem.medicine.name}. Available: ${prescItem.medicine.stockQuantity}, Requested: ${reqItem.quantity}`);
        err.statusCode = 400;
        err.code = "INSUFFICIENT_STOCK";
        throw err;
      }

      // Create PharmacyTransaction linked to prescriptionItem.id
      await tx.pharmacyTransaction.create({
        data: {
          medicineId: prescItem.medicineId,
          type: PharmacyTransactionType.DISPENSE,
          quantity: reqItem.quantity,
          referenceId: prescItem.id,
          pharmacyOrderId: pharmacyOrder.id,
          performedBy: actorId,
          timestamp: new Date()
        }
      });
    }

    // Check if ALL items in prescription are now fully dispensed
    let allItemsFullyDispensed = true;

    for (const item of prescription.items) {
      const txns = await tx.pharmacyTransaction.findMany({
        where: { referenceId: item.id, type: PharmacyTransactionType.DISPENSE }
      });
      const totalDisp = txns.reduce((acc, t) => acc + t.quantity, 0);
      if (totalDisp < item.quantity) {
        allItemsFullyDispensed = false;
        break;
      }
    }

    if (allItemsFullyDispensed) {
      await tx.prescription.update({
        where: { id: prescriptionId },
        data: { status: PrescriptionStatus.DISPENSED }
      });

      await tx.pharmacyOrder.update({
        where: { id: pharmacyOrder.id },
        data: {
          status: PharmacyOrderStatus.DISPENSED,
          dispensedAt: new Date()
        }
      });
    }

    // Log AuditLog
    await tx.auditLog.create({
      data: {
        actorId,
        action: "PRESCRIPTION_DISPENSED",
        entityType: "Prescription",
        entityId: prescriptionId,
        metadata: {
          patientId: prescription.patientId,
          prescriptionId,
          pharmacyOrderId: pharmacyOrder.id,
          isFullyDispensed: allItemsFullyDispensed,
          dispensedItemsCount: payload.items.length
        }
      }
    });

    // Log ActivityEvent for Patient History
    await tx.activityEvent.create({
      data: {
        patientId: prescription.patientId,
        actorId,
        actorType: "PHARMACIST",
        eventType: "PHARMACY_DISPENSED",
        timestamp: new Date(),
        department: "PHARMACY",
        description: `Prescription medications dispensed by pharmacy (${payload.items.length} item(s))`,
        metadata: {
          prescriptionId,
          pharmacyOrderId: pharmacyOrder.id,
          isFullyDispensed: allItemsFullyDispensed
        }
      }
    });

    return {
      prescriptionId,
      pharmacyOrderId: pharmacyOrder.id,
      isFullyDispensed: allItemsFullyDispensed,
      dispensedItemsCount: payload.items.length
    };
  });
};
