import { prisma } from "../utils/prisma.js";
import { QueueStatus, LabOrderStatus, WardRoundStatus, UserRole } from "@prisma/client";

export interface DashboardData {
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

export const getDashboardDataForDoctor = async (
  userId: string,
  userRole: UserRole,
  userName: string
): Promise<DashboardData> => {
  const doctorName = userName.startsWith("Dr.") ? userName : `Dr. ${userName}`;
  const greeting = `Good Morning, ${doctorName}.`;

  // If user is not a DOCTOR (e.g. ADMIN/SUPER_ADMIN), return zero metrics safely
  if (userRole !== UserRole.DOCTOR) {
    return {
      greeting,
      stats: {
        myQueue: { count: 0, highPriority: 0 },
        pendingReports: { count: 0, ready: 0 },
        ipdRounds: { count: 0, pending: 0 }
      },
      upcomingAppointments: []
    };
  }

  // 1. MY QUEUE
  // Active queue statuses: WAITING, CHECKED_IN, IN_CONSULTATION, ON_HOLD
  const activeQueueCount = await prisma.queueEntry.count({
    where: {
      doctorId: userId,
      status: {
        in: [
          QueueStatus.WAITING,
          QueueStatus.CHECKED_IN,
          QueueStatus.IN_CONSULTATION,
          QueueStatus.ON_HOLD
        ]
      }
    }
  });

  const highPriorityQueueCount = await prisma.queueEntry.count({
    where: {
      doctorId: userId,
      status: {
        in: [
          QueueStatus.WAITING,
          QueueStatus.CHECKED_IN,
          QueueStatus.IN_CONSULTATION,
          QueueStatus.ON_HOLD
        ]
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
