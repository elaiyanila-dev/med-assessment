import { prisma } from "../utils/prisma.js";
import { QueueStatus, UserRole } from "@prisma/client";

export interface QueueFilters {
  search?: string;
  status?: string;
}

export interface QueueSummary {
  total: number;
  waiting: number;
  checkedIn: number;
  inConsultation: number;
  onHold: number;
  highPriority: number;
}

export interface QueueItemResponse {
  id: string;
  patientId: string;
  patientName: string;
  patientUHID: string;
  patientAge?: number | null;
  patientGender: string;
  patientMobile: string;
  token: number | string;
  arrivalTime: Date | string;
  status: QueueStatus;
  priority: string;
  source: string;
}

export interface QueueDataResponse {
  summary: QueueSummary;
  entries: QueueItemResponse[];
}

export const getDoctorQueueData = async (
  userId: string,
  userRole: UserRole,
  filters: QueueFilters = {}
): Promise<QueueDataResponse> => {
  // Scoping: If user is not a DOCTOR (e.g. ADMIN/SUPER_ADMIN), return zero metrics safely
  if (userRole !== UserRole.DOCTOR) {
    return {
      summary: {
        total: 0,
        waiting: 0,
        checkedIn: 0,
        inConsultation: 0,
        onHold: 0,
        highPriority: 0
      },
      entries: []
    };
  }

  // 1. Calculate Summary Counts
  const totalActive = await prisma.queueEntry.count({
    where: {
      doctorId: userId,
      status: { notIn: [QueueStatus.COMPLETED, QueueStatus.CANCELLED] }
    }
  });

  const waitingCount = await prisma.queueEntry.count({
    where: { doctorId: userId, status: QueueStatus.WAITING }
  });

  const checkedInCount = await prisma.queueEntry.count({
    where: { doctorId: userId, status: QueueStatus.CHECKED_IN }
  });

  const inConsultationCount = await prisma.queueEntry.count({
    where: { doctorId: userId, status: QueueStatus.IN_CONSULTATION }
  });

  const onHoldCount = await prisma.queueEntry.count({
    where: { doctorId: userId, status: QueueStatus.ON_HOLD }
  });

  const highPriorityCount = await prisma.queueEntry.count({
    where: {
      doctorId: userId,
      status: { notIn: [QueueStatus.COMPLETED, QueueStatus.CANCELLED] },
      priority: { in: ["HIGH", "URGENT", "EMERGENCY"] }
    }
  });

  // 2. Build Where Clause for Entries
  const whereClause: any = {
    doctorId: userId
  };

  if (filters.status && Object.values(QueueStatus).includes(filters.status as QueueStatus)) {
    whereClause.status = filters.status as QueueStatus;
  } else {
    // Default to active queue unless specifically requesting completed/cancelled
    whereClause.status = { notIn: [QueueStatus.COMPLETED, QueueStatus.CANCELLED] };
  }

  if (filters.search && filters.search.trim() !== "") {
    const searchTerm = filters.search.trim();
    whereClause.patient = {
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { UHID: { contains: searchTerm, mode: "insensitive" } },
        { mobile: { contains: searchTerm, mode: "insensitive" } }
      ]
    };
  }

  // 3. Query Queue Entries
  const rawEntries = await prisma.queueEntry.findMany({
    where: whereClause,
    orderBy: {
      arrivalTime: "asc"
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          UHID: true,
          age: true,
          gender: true,
          mobile: true
        }
      }
    }
  });

  const entries: QueueItemResponse[] = rawEntries.map((e) => ({
    id: e.id,
    patientId: e.patientId,
    patientName: e.patient.name,
    patientUHID: e.patient.UHID,
    patientAge: e.patient.age,
    patientGender: e.patient.gender,
    patientMobile: e.patient.mobile,
    token: e.token,
    arrivalTime: e.arrivalTime.toISOString(),
    status: e.status,
    priority: e.priority,
    source: e.source
  }));

  return {
    summary: {
      total: totalActive,
      waiting: waitingCount,
      checkedIn: checkedInCount,
      inConsultation: inConsultationCount,
      onHold: onHoldCount,
      highPriority: highPriorityCount
    },
    entries
  };
};

export const updateQueueEntryStatus = async (
  doctorId: string,
  queueId: string,
  requestedStatus: QueueStatus
) => {
  const existingEntry = await prisma.queueEntry.findUnique({
    where: { id: queueId },
    include: { patient: true }
  });

  if (!existingEntry) {
    const err: any = new Error("Queue entry not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  if (existingEntry.doctorId !== doctorId) {
    const err: any = new Error("Not authorized to modify this queue entry");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  // State Transition Validation Matrix
  const validTransitions: Record<QueueStatus, QueueStatus[]> = {
    [QueueStatus.WAITING]: [
      QueueStatus.IN_CONSULTATION,
      QueueStatus.CHECKED_IN,
      QueueStatus.ON_HOLD,
      QueueStatus.CANCELLED
    ],
    [QueueStatus.CHECKED_IN]: [
      QueueStatus.IN_CONSULTATION,
      QueueStatus.ON_HOLD,
      QueueStatus.CANCELLED
    ],
    [QueueStatus.IN_CONSULTATION]: [
      QueueStatus.COMPLETED,
      QueueStatus.ON_HOLD,
      QueueStatus.CANCELLED
    ],
    [QueueStatus.ON_HOLD]: [
      QueueStatus.WAITING,
      QueueStatus.IN_CONSULTATION,
      QueueStatus.CANCELLED
    ],
    [QueueStatus.COMPLETED]: [],
    [QueueStatus.CANCELLED]: []
  };

  const allowedNextStatuses = validTransitions[existingEntry.status] || [];
  if (!allowedNextStatuses.includes(requestedStatus)) {
    const err: any = new Error(
      `Invalid status transition from '${existingEntry.status}' to '${requestedStatus}'`
    );
    err.statusCode = 400;
    err.code = "INVALID_TRANSITION";
    throw err;
  }

  // Execute status update and audit log in a single transaction
  const [updatedEntry] = await prisma.$transaction([
    prisma.queueEntry.update({
      where: { id: queueId },
      data: { status: requestedStatus },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            UHID: true,
            age: true,
            gender: true,
            mobile: true
          }
        }
      }
    }),
    prisma.auditLog.create({
      data: {
        actorId: doctorId,
        action: "QUEUE_STATUS_CHANGED",
        entityType: "QueueEntry",
        entityId: queueId,
        metadata: {
          oldStatus: existingEntry.status,
          newStatus: requestedStatus,
          patientId: existingEntry.patientId,
          patientName: existingEntry.patient.name
        }
      }
    })
  ]);

  return {
    id: updatedEntry.id,
    patientId: updatedEntry.patientId,
    patientName: updatedEntry.patient.name,
    patientUHID: updatedEntry.patient.UHID,
    patientAge: updatedEntry.patient.age,
    patientGender: updatedEntry.patient.gender,
    patientMobile: updatedEntry.patient.mobile,
    token: updatedEntry.token,
    arrivalTime: updatedEntry.arrivalTime.toISOString(),
    status: updatedEntry.status,
    priority: updatedEntry.priority,
    source: updatedEntry.source
  };
};
