import { prisma } from "../utils/prisma.js";
import {
  AdmissionStatus,
  BedStatus,
  LabOrderStatus,
  QueueStatus,
  UserRole,
  WardRoundStatus
} from "@prisma/client";

interface AdminDashboardData {
  type: "ADMIN";
  greeting: string;
  commandCenter: {
    totalWalkIns: number;
    activeInFacility: number;
    avgWaitMinutes: number;
    estimatedRevenue: number;
    highVolume: boolean;
  };
  flowPipeline: Array<{
    label: string;
    count: number;
    capacity: number;
    status?: "busy" | "normal";
  }>;
  arrivalTrend: Array<{
    hour: string;
    count: number;
  }>;
  departmentLoad: Array<{
    department: string;
    count: number;
    load: "Critical Load" | "High Load" | "Normal Load";
  }>;
  resourceStatus: {
    doctors: {
      active: number;
      total: number;
    };
    beds: {
      occupied: number;
      total: number;
      percent: number;
    };
  };
  revenueClassification: Array<{
    label: string;
    amount: number;
  }>;
  patientClassification: {
    total: number;
    new: number;
    returning: number;
    newPercent: number;
    returningPercent: number;
  };
}

export interface DashboardData {
  type?: "DOCTOR";
  greeting: string;
  stats: {
    myQueue: {
      count: number;
      highPriority: number;
    };
    pendingReports: {
      count: number;
      ready: number;
    };
    ipdRounds: {
      count: number;
      pending: number;
    };
    appointments?: {
      today: number;
      pendingCheckIns: number;
    };
  };
  upcomingAppointments: Array<{
    id: string;
    patientId: string;
    patientName: string;
    patientUHID: string;
    type: string;
    scheduledAt: Date | string;
    status: string;
  }>;
}

export type RoleDashboardData = DashboardData | AdminDashboardData;

const activeQueueStatuses = [
  QueueStatus.WAITING,
  QueueStatus.CHECKED_IN,
  QueueStatus.IN_CONSULTATION,
  QueueStatus.ON_HOLD
];

const todayBounds = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const formatHour = (hour: number) => `${hour.toString().padStart(2, "0")}:00`;

export const getDashboardDataForAdmin = async (userName: string): Promise<AdminDashboardData> => {
  const { start, end } = todayBounds();

  const [
    totalPatients,
    todayPatients,
    activeQueue,
    queueEntries,
    consultations,
    vitals,
    labOrders,
    pharmacyOrders,
    totalRevenue,
    activeAdmissions,
    totalDoctors,
    activeDoctors,
    totalBeds,
    occupiedBeds,
    departmentGroups,
    appointmentsToday
  ] = await Promise.all([
    prisma.patient.count({ where: { deletedAt: null } }),
    prisma.patient.count({ where: { deletedAt: null, createdAt: { gte: start, lte: end } } }),
    prisma.queueEntry.count({ where: { status: { in: activeQueueStatuses } } }),
    prisma.queueEntry.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { arrivalTime: true, status: true }
    }),
    prisma.consultation.count(),
    prisma.vital.count(),
    prisma.labOrder.count(),
    prisma.pharmacyOrder.count(),
    prisma.pharmacyOrder.aggregate({ _sum: { totalAmount: true } }),
    prisma.admission.count({ where: { status: AdmissionStatus.ACTIVE } }),
    prisma.user.count({ where: { role: UserRole.DOCTOR, deletedAt: null } }),
    prisma.user.count({ where: { role: UserRole.DOCTOR, status: "ACTIVE", deletedAt: null } }),
    prisma.bed.count(),
    prisma.bed.count({ where: { status: BedStatus.OCCUPIED } }),
    prisma.patient.groupBy({
      by: ["department"],
      where: { deletedAt: null },
      _count: { _all: true },
      orderBy: { _count: { department: "desc" } },
      take: 5
    }),
    prisma.appointment.findMany({
      where: { scheduledAt: { gte: start, lte: end } },
      select: { scheduledAt: true }
    })
  ]);

  const completedQueue = queueEntries.filter((entry) => entry.status === QueueStatus.COMPLETED);
  const waitTotal = completedQueue.reduce((total, entry) => {
    return total + Math.max(0, Date.now() - entry.arrivalTime.getTime());
  }, 0);
  const avgWaitMinutes = completedQueue.length
    ? Math.round(waitTotal / completedQueue.length / 60000)
    : Math.max(10, Math.min(55, activeQueue * 5));

  const occupiedPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const pharmacyRevenue = Math.round(totalRevenue._sum.totalAmount || 0);
  const opdRevenue = appointmentsToday.length * 500;
  const ipdRevenue = activeAdmissions * 2500;
  const labRevenueAmount = labOrders * 450;
  const estimatedRevenue = pharmacyRevenue + opdRevenue + ipdRevenue + labRevenueAmount;
  const returning = Math.max(totalPatients - todayPatients, 0);
  const newPercent = totalPatients > 0 ? Math.round((todayPatients / totalPatients) * 100) : 0;

  const arrivalTrend = Array.from({ length: 8 }, (_, index) => {
    const hour = index + 8;
    return {
      hour: formatHour(hour),
      count: appointmentsToday.filter((apt) => apt.scheduledAt.getHours() === hour).length
    };
  });

  return {
    type: "ADMIN",
    greeting: `Command center ready, ${userName}.`,
    commandCenter: {
      totalWalkIns: totalPatients,
      activeInFacility: activeQueue + activeAdmissions,
      avgWaitMinutes,
      estimatedRevenue,
      highVolume: activeQueue + activeAdmissions > 20 || avgWaitMinutes > 45
    },
    flowPipeline: [
      { label: "Registration", count: totalPatients, capacity: Math.min(100, Math.round((totalPatients / 400) * 100)) },
      { label: "Vitals / Triage", count: vitals, capacity: Math.min(100, Math.round((vitals / Math.max(totalPatients, 1)) * 100)) },
      { label: "Dr. Consult", count: consultations, capacity: Math.min(100, Math.round((consultations / Math.max(totalPatients, 1)) * 100)), status: activeQueue > 10 ? "busy" : "normal" },
      { label: "Diagnostics", count: labOrders, capacity: Math.min(100, Math.round((labOrders / Math.max(totalPatients, 1)) * 100)) },
      { label: "Pharmacy", count: pharmacyOrders, capacity: Math.min(100, Math.round((pharmacyOrders / Math.max(totalPatients, 1)) * 100)) }
    ],
    arrivalTrend,
    departmentLoad: departmentGroups.map((group) => {
      const count = group._count._all;
      return {
        department: group.department || "Unassigned",
        count,
        load: count >= 100 ? "Critical Load" : count >= 60 ? "High Load" : "Normal Load"
      };
    }),
    resourceStatus: {
      doctors: { active: activeDoctors, total: totalDoctors },
      beds: { occupied: occupiedBeds, total: totalBeds, percent: occupiedPercent }
    },
    revenueClassification: [
      { label: "OPD Consult", amount: opdRevenue },
      { label: "IPD Charges", amount: ipdRevenue },
      { label: "Pharmacy", amount: pharmacyRevenue },
      { label: "Laboratory", amount: labRevenueAmount }
    ],
    patientClassification: {
      total: totalPatients,
      new: todayPatients,
      returning,
      newPercent,
      returningPercent: 100 - newPercent
    }
  };
};

export const getDashboardDataForDoctor = async (
  userId: string,
  userRole: UserRole,
  userName: string
): Promise<RoleDashboardData> => {
  const doctorName = userName.startsWith("Dr.") ? userName : `Dr. ${userName}`;
  const greeting = `Good Morning, ${doctorName}.`;

  if (
    userRole === UserRole.ADMIN ||
    userRole === UserRole.SUPER_ADMIN ||
    userRole === UserRole.RECEPTIONIST
  ) {
    return getDashboardDataForAdmin(userName);
  }

  if (userRole !== UserRole.DOCTOR) {
    return getDashboardDataForAdmin(userName);
  }

  // 1. MY QUEUE
  // Active queue statuses: WAITING, CHECKED_IN, IN_CONSULTATION, ON_HOLD
  const activeQueueCount = await prisma.queueEntry.count({
    where: {
      doctorId: userId,
      status: {
        in: activeQueueStatuses
      }
    }
  });

  const highPriorityQueueCount = await prisma.queueEntry.count({
    where: {
      doctorId: userId,
      status: {
        in: activeQueueStatuses
      },
      priority: {
        in: ["HIGH", "URGENT", "EMERGENCY"]
      }
    }
  });

  // 2. PENDING REPORTS
  // LabOrder status IN [RESULT_READY, CRITICAL]
  const pendingReportsCount = await prisma.labOrder.count({
    where: {
      doctorId: userId,
      status: {
        in: [LabOrderStatus.RESULT_READY, LabOrderStatus.CRITICAL]
      }
    }
  });

  const labResultsReadyCount = await prisma.labOrder.count({
    where: {
      doctorId: userId,
      status: {
        in: [LabOrderStatus.RESULT_READY, LabOrderStatus.CRITICAL]
      }
    }
  });

  // 3. IPD ROUNDS
  // WardRound assigned to doctor with status = PENDING
  const pendingRoundsCount = await prisma.wardRound.count({
    where: {
      doctorId: userId,
      status: WardRoundStatus.PENDING
    }
  });

  // 4. UPCOMING APPOINTMENTS
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: userId
    },
    orderBy: {
      scheduledAt: "asc"
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          UHID: true
        }
      }
    }
  });

  const upcomingAppointments = appointments.map((apt) => ({
    id: apt.id,
    patientId: apt.patientId,
    patientName: apt.patient.name,
    patientUHID: apt.patient.UHID,
    type: apt.type,
    scheduledAt: apt.scheduledAt.toISOString(),
    status: apt.status
  }));

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayAppointmentsCount = upcomingAppointments.filter((a) => {
    const time = new Date(a.scheduledAt);
    return time >= todayStart && time <= todayEnd;
  }).length;

  const pendingCheckInsCount = upcomingAppointments.filter((a) => a.status === "SCHEDULED").length;

  return {
    type: "DOCTOR",
    greeting,
    stats: {
      myQueue: {
        count: activeQueueCount,
        highPriority: highPriorityQueueCount
      },
      pendingReports: {
        count: pendingReportsCount,
        ready: labResultsReadyCount
      },
      ipdRounds: {
        count: pendingRoundsCount,
        pending: pendingRoundsCount
      },
      appointments: {
        today: todayAppointmentsCount,
        pendingCheckIns: pendingCheckInsCount
      }
    },
    upcomingAppointments
  };
};
