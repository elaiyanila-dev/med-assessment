import { prisma } from "../utils/prisma.js";
import { PrescriptionStatus, UserRole } from "@prisma/client";

export interface PrescriptionFilterQuery {
  search?: string;
  status?: string;
  patientId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  userId?: string;
  userRole?: UserRole;
}

export const getPrescriptionList = async (query: PrescriptionFilterQuery) => {
  const {
    search,
    status,
    patientId,
    doctorId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    userId,
    userRole
  } = query;

  const pageNumber = Math.max(1, Number(page));
  const limitNumber = Math.max(1, Math.min(100, Number(limit)));
  const skip = (pageNumber - 1) * limitNumber;

  const where: any = {};

  // Role scoping: DOCTOR role defaults to viewing their own issued prescriptions unless specific doctorId requested
  if (userRole === UserRole.DOCTOR && userId && !doctorId) {
    where.doctorId = userId;
  } else if (doctorId) {
    where.doctorId = doctorId;
  }

  if (patientId) {
    where.patientId = patientId;
  }

  if (status && status !== "ALL") {
    where.status = status as PrescriptionStatus;
  }

  if (startDate || endDate) {
    where.prescribedAt = {};
    if (startDate) {
      where.prescribedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.prescribedAt.lte = new Date(endDate);
    }
  }

  if (search && search.trim() !== "") {
    const term = search.trim();
    where.OR = [
      { id: { contains: term, mode: "insensitive" } },
      { patient: { name: { contains: term, mode: "insensitive" } } },
      { patient: { UHID: { contains: term, mode: "insensitive" } } },
      { doctor: { name: { contains: term, mode: "insensitive" } } },
      { items: { some: { medicine: { name: { contains: term, mode: "insensitive" } } } } }
    ];
  }

  const [total, prescriptions] = await Promise.all([
    prisma.prescription.count({ where }),
    prisma.prescription.findMany({
      where,
      skip,
      take: limitNumber,
      orderBy: { prescribedAt: "desc" },
      include: {
        patient: {
          select: { id: true, name: true, UHID: true, age: true, gender: true, mobile: true }
        },
        doctor: {
          select: { id: true, name: true, role: true, department: true }
        },
        items: {
          include: {
            medicine: {
              select: { id: true, name: true, genericName: true, category: true, unit: true, rackLocation: true, stockQuantity: true }
            }
          }
        },
        pharmacyOrders: {
          select: { id: true, status: true, totalAmount: true, dispensedAt: true }
        }
      }
    })
  ]);

  return {
    prescriptions: prescriptions.map((p) => ({
      id: p.id,
      patientId: p.patientId,
      patientName: p.patient.name,
      patientUHID: p.patient.UHID,
      patientAge: p.patient.age,
      patientGender: p.patient.gender,
      doctorId: p.doctorId,
      doctorName: p.doctor.name,
      doctorDepartment: p.doctor.department,
      consultationId: p.consultationId,
      status: p.status,
      prescribedAt: p.prescribedAt.toISOString(),
      itemCount: p.items.length,
      items: p.items.map((item) => ({
        id: item.id,
        medicineId: item.medicineId,
        medicineName: item.medicine.name,
        genericName: item.medicine.genericName,
        dosage: item.dosage,
        frequency: item.frequency,
        durationDays: item.durationDays,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        stockQuantity: item.medicine.stockQuantity,
        rackLocation: item.medicine.rackLocation
      })),
      pharmacyOrderStatus: p.pharmacyOrders[0]?.status || null,
      dispensedAt: p.pharmacyOrders[0]?.dispensedAt ? p.pharmacyOrders[0].dispensedAt.toISOString() : null
    })),
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber)
    }
  };
};

export const getPrescriptionDetails = async (prescriptionId: string) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      patient: {
        include: {
          allergies: true,
          conditions: true
        }
      },
      doctor: {
        select: { id: true, name: true, role: true, department: true, specialization: true }
      },
      consultation: {
        select: { id: true, status: true, subjective: true, objective: true, assessment: true, plan: true }
      },
      items: {
        include: {
          medicine: true
        }
      },
      pharmacyOrders: {
        include: {
          transactions: {
            include: { performer: { select: { id: true, name: true, role: true } } }
          }
        }
      }
    }
  });

  if (!prescription) {
    return null;
  }

  return {
    id: prescription.id,
    status: prescription.status,
    prescribedAt: prescription.prescribedAt.toISOString(),
    createdAt: prescription.createdAt.toISOString(),
    patient: {
      id: prescription.patient.id,
      name: prescription.patient.name,
      UHID: prescription.patient.UHID,
      age: prescription.patient.age,
      gender: prescription.patient.gender,
      mobile: prescription.patient.mobile,
      bloodGroup: prescription.patient.bloodGroup,
      allergies: prescription.patient.allergies.map((a) => ({ id: a.id, allergen: a.allergen, severity: a.severity })),
      conditions: prescription.patient.conditions.map((c) => ({ id: c.id, condition: c.condition, status: c.status }))
    },
    doctor: {
      id: prescription.doctor.id,
      name: prescription.doctor.name,
      role: prescription.doctor.role,
      department: prescription.doctor.department,
      specialization: prescription.doctor.specialization
    },
    consultation: prescription.consultation ? {
      id: prescription.consultation.id,
      status: prescription.consultation.status,
      assessment: prescription.consultation.assessment,
      plan: prescription.consultation.plan
    } : null,
    items: prescription.items.map((item) => ({
      id: item.id,
      medicineId: item.medicineId,
      medicineName: item.medicine.name,
      genericName: item.medicine.genericName,
      category: item.medicine.category,
      unit: item.medicine.unit,
      dosage: item.dosage,
      frequency: item.frequency,
      durationDays: item.durationDays,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      rackLocation: item.medicine.rackLocation,
      stockQuantity: item.medicine.stockQuantity
    })),
    pharmacyOrder: prescription.pharmacyOrders[0] ? {
      id: prescription.pharmacyOrders[0].id,
      status: prescription.pharmacyOrders[0].status,
      totalAmount: prescription.pharmacyOrders[0].totalAmount,
      dispensedAt: prescription.pharmacyOrders[0].dispensedAt ? prescription.pharmacyOrders[0].dispensedAt.toISOString() : null,
      transactions: prescription.pharmacyOrders[0].transactions.map((t) => ({
        id: t.id,
        type: t.type,
        quantity: t.quantity,
        timestamp: t.timestamp.toISOString(),
        performerName: t.performer.name
      }))
    } : null
  };
};
