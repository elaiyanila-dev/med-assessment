import { prisma } from "../utils/prisma.js";
import { UserRole, QueueStatus, ConsultationStatus, AdmissionStatus, LabOrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

export const getUserDirectory = async (
  actorId: string,
  actorRole: UserRole,
  search?: string,
  roleFilter?: string,
  departmentFilter?: string,
  statusFilter?: string,
  page: number = 1,
  limit: number = 20
) => {
  // STRICTLY READ-ONLY: No database writes, no AuditLogs, no ActivityEvents
  const whereClause: any = {
    deletedAt: null
  };

  if (search && search.trim() !== "") {
    const term = search.trim();
    whereClause.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { phone: { contains: term, mode: "insensitive" } },
      { role: { equals: term.toUpperCase() as UserRole } },
      { department: { contains: term, mode: "insensitive" } }
    ];
  }

  if (roleFilter && roleFilter !== "ALL") {
    whereClause.role = roleFilter as UserRole;
  }

  if (departmentFilter && departmentFilter !== "ALL") {
    whereClause.department = departmentFilter;
  }

  if (statusFilter && statusFilter !== "ALL") {
    whereClause.status = statusFilter;
  }

  const skip = (page - 1) * limit;

  const [totalCount, users] = await Promise.all([
    prisma.user.count({ where: whereClause }),
    prisma.user.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        specialization: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })
  ]);

  // Overall directory metrics (excluding soft deleted users)
  const [totalStaff, activeStaff, doctorsCount, nursesCount, inactiveOrSuspendedCount] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.user.count({ where: { deletedAt: null, role: UserRole.DOCTOR } }),
    prisma.user.count({ where: { deletedAt: null, role: UserRole.NURSE } }),
    prisma.user.count({ where: { deletedAt: null, status: { in: ["INACTIVE", "SUSPENDED"] } } })
  ]);

  return {
    metrics: {
      totalStaff,
      activeStaff,
      doctorsCount,
      nursesCount,
      inactiveOrSuspendedCount
    },
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    },
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      department: u.department,
      specialization: u.specialization,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString()
    }))
  };
};

export const getUserProfileDetails = async (
  actorId: string,
  actorRole: UserRole,
  targetUserId: string
) => {
  // STRICTLY READ-ONLY: No database writes
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      department: true,
      specialization: true,
      status: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
      nurseProfiles: true
    }
  });

  if (!user || user.deletedAt !== null) {
    const err: any = new Error("Staff user record not found");
    err.statusCode = 404;
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  // Operational metrics based on existing schema relations
  const [
    assignedQueueEntriesCount,
    activeConsultationsCount,
    activeAdmissionsCount,
    labOrdersCount,
    scheduledAppointmentsCount
  ] = await Promise.all([
    prisma.queueEntry.count({
      where: { doctorId: targetUserId, status: { in: [QueueStatus.WAITING, QueueStatus.IN_CONSULTATION] } }
    }),
    prisma.consultation.count({
      where: { doctorId: targetUserId, status: { in: [ConsultationStatus.READY, ConsultationStatus.IN_PROGRESS] } }
    }),
    prisma.admission.count({
      where: { doctorId: targetUserId, status: AdmissionStatus.ACTIVE }
    }),
    prisma.labOrder.count({
      where: { doctorId: targetUserId, status: { in: [LabOrderStatus.ORDERED, LabOrderStatus.COLLECTED, LabOrderStatus.PROCESSING] } }
    }),
    prisma.appointment.count({
      where: { doctorId: targetUserId, status: "SCHEDULED" }
    })
  ]);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    department: user.department,
    specialization: user.specialization,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    nurseDetails: user.nurseProfiles.length > 0 ? user.nurseProfiles[0] : null,
    operationalMetrics: {
      assignedQueueEntriesCount,
      activeConsultationsCount,
      activeAdmissionsCount,
      labOrdersCount,
      scheduledAppointmentsCount
    }
  };
};

export const createUserRecord = async (
  actorId: string,
  payload: {
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    department?: string;
    specialization?: string;
    password?: string;
  }
) => {
  const normalizedEmail = payload.email.trim().toLowerCase();

  try {
    return await prisma.$transaction(async (tx) => {
      // Transaction Advisory Lock on Email for CONCURRENCY PROTECTION
      const emailLockKey = `user_email_${normalizedEmail}`;
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${emailLockKey}));
      `;

      // Check existing email inside transaction
      const existingUser = await tx.user.findFirst({
        where: { email: normalizedEmail }
      });

      if (existingUser) {
        const err: any = new Error(`User with email ${normalizedEmail} already exists`);
        err.statusCode = 409;
        err.code = "DUPLICATE_USER_EMAIL";
        throw err;
      }

      const rawPassword = payload.password || "MedNxt@123";
      if (rawPassword.length < 8) {
        const err: any = new Error("Password must be at least 8 characters long");
        err.statusCode = 400;
        err.code = "BAD_REQUEST";
        throw err;
      }

      const passwordHash = await bcrypt.hash(rawPassword, 10);

      // Create User
      const user = await tx.user.create({
        data: {
          name: payload.name,
          email: normalizedEmail,
          phone: payload.phone || null,
          passwordHash,
          role: payload.role,
          department: payload.department || null,
          specialization: payload.specialization || null,
          status: "ACTIVE"
        }
      });

      // If Nurse role, optionally create default Nurse profile
      if (payload.role === UserRole.NURSE) {
        await tx.nurse.create({
          data: {
            userId: user.id,
            shift: "DAY",
            startTime: "07:00",
            endTime: "15:00",
            ward: payload.department || "General Ward",
            status: "ON_DUTY"
          }
        });
      }

      // Create exactly 1 AuditLog inside transaction
      await tx.auditLog.create({
        data: {
          actorId,
          action: "USER_CREATED",
          entityType: "USER",
          entityId: user.id,
          metadata: {
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department
          }
        }
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        specialization: user.specialization,
        status: user.status,
        createdAt: user.createdAt.toISOString()
      };
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      const err: any = new Error("Duplicate staff user registration failed");
      err.statusCode = 409;
      err.code = "DUPLICATE_USER_EMAIL";
      throw err;
    }
    throw error;
  }
};

export const updateUserDemographics = async (
  actorId: string,
  actorRole: UserRole,
  targetUserId: string,
  payload: {
    name?: string;
    phone?: string;
    department?: string;
    specialization?: string;
  }
) => {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user || user.deletedAt !== null) {
    const err: any = new Error("Staff user record not found");
    err.statusCode = 404;
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: targetUserId },
      data: {
        name: payload.name ?? user.name,
        phone: payload.phone !== undefined ? payload.phone : user.phone,
        department: payload.department !== undefined ? payload.department : user.department,
        specialization: payload.specialization !== undefined ? payload.specialization : user.specialization
      }
    });

    // AuditLog
    await tx.auditLog.create({
      data: {
        actorId,
        action: "USER_DEMOGRAPHICS_UPDATED",
        entityType: "USER",
        entityId: targetUserId,
        metadata: {
          updatedFields: Object.keys(payload),
          targetEmail: user.email
        }
      }
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      department: updatedUser.department,
      specialization: updatedUser.specialization,
      status: updatedUser.status,
      updatedAt: updatedUser.updatedAt.toISOString()
    };
  });
};

export const updateUserStatus = async (
  actorId: string,
  actorRole: UserRole,
  targetUserId: string,
  newStatus: string
) => {
  const validStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"];
  if (!validStatuses.includes(newStatus)) {
    const err: any = new Error(`Invalid status '${newStatus}'. Allowed: ACTIVE, INACTIVE, SUSPENDED`);
    err.statusCode = 400;
    err.code = "BAD_REQUEST";
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    // Re-query target user inside transaction
    const user = await tx.user.findUnique({ where: { id: targetUserId } });
    if (!user || user.deletedAt !== null) {
      const err: any = new Error("Staff user record not found");
      err.statusCode = 404;
      err.code = "USER_NOT_FOUND";
      throw err;
    }

    const updatedUser = await tx.user.update({
      where: { id: targetUserId },
      data: { status: newStatus }
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "USER_STATUS_CHANGED",
        entityType: "USER",
        entityId: targetUserId,
        metadata: {
          previousStatus: user.status,
          newStatus
        }
      }
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      updatedAt: updatedUser.updatedAt.toISOString()
    };
  });
};

export const resetUserPassword = async (
  actorId: string,
  actorRole: UserRole,
  targetUserId: string,
  newPassword: string
) => {
  if (!newPassword || newPassword.length < 8) {
    const err: any = new Error("New password must be at least 8 characters long");
    err.statusCode = 400;
    err.code = "BAD_REQUEST";
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: targetUserId } });
    if (!user || user.deletedAt !== null) {
      const err: any = new Error("Staff user record not found");
      err.statusCode = 404;
      err.code = "USER_NOT_FOUND";
      throw err;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await tx.user.update({
      where: { id: targetUserId },
      data: { passwordHash }
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "USER_PASSWORD_RESET",
        entityType: "USER",
        entityId: targetUserId,
        metadata: {
          targetEmail: user.email,
          targetRole: user.role
        }
      }
    });

    return {
      success: true,
      message: "User password reset successfully"
    };
  });
};

export const softDeleteUser = async (
  actorId: string,
  actorRole: UserRole,
  targetUserId: string
) => {
  if (actorRole !== UserRole.SUPER_ADMIN) {
    const err: any = new Error("Super Administrator role required to soft-delete staff accounts");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  if (actorId === targetUserId) {
    const err: any = new Error("Super Administrators cannot soft-delete their own account");
    err.statusCode = 400;
    err.code = "CANNOT_DELETE_SELF";
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: targetUserId } });
    if (!user || user.deletedAt !== null) {
      const err: any = new Error("Staff user record not found");
      err.statusCode = 404;
      err.code = "USER_NOT_FOUND";
      throw err;
    }

    // 1. Active QueueEntry check
    const activeQueue = await tx.queueEntry.findFirst({
      where: {
        doctorId: targetUserId,
        status: { in: [QueueStatus.WAITING, QueueStatus.IN_CONSULTATION] }
      }
    });
    if (activeQueue) {
      const err: any = new Error("Cannot delete user with active queue entries");
      err.statusCode = 400;
      err.code = "ACTIVE_ASSIGNMENTS_EXIST";
      throw err;
    }

    // 2. Active Consultation check
    const activeConsultation = await tx.consultation.findFirst({
      where: {
        doctorId: targetUserId,
        status: { in: [ConsultationStatus.READY, ConsultationStatus.IN_PROGRESS] }
      }
    });
    if (activeConsultation) {
      const err: any = new Error("Cannot delete user with active consultations in progress");
      err.statusCode = 400;
      err.code = "ACTIVE_ASSIGNMENTS_EXIST";
      throw err;
    }

    // 3. Active Admission check
    const activeAdmission = await tx.admission.findFirst({
      where: {
        doctorId: targetUserId,
        status: AdmissionStatus.ACTIVE
      }
    });
    if (activeAdmission) {
      const err: any = new Error("Cannot delete doctor assigned to active IPD bed admissions");
      err.statusCode = 400;
      err.code = "ACTIVE_ASSIGNMENTS_EXIST";
      throw err;
    }

    // 4. Active LabOrder check
    const activeLabOrder = await tx.labOrder.findFirst({
      where: {
        doctorId: targetUserId,
        status: { in: [LabOrderStatus.ORDERED, LabOrderStatus.COLLECTED, LabOrderStatus.PROCESSING] }
      }
    });
    if (activeLabOrder) {
      const err: any = new Error("Cannot delete doctor with active laboratory orders in process");
      err.statusCode = 400;
      err.code = "ACTIVE_ASSIGNMENTS_EXIST";
      throw err;
    }

    // 5. Active Appointment check
    const activeAppointment = await tx.appointment.findFirst({
      where: {
        doctorId: targetUserId,
        status: "SCHEDULED"
      }
    });
    if (activeAppointment) {
      const err: any = new Error("Cannot delete doctor with active scheduled appointments");
      err.statusCode = 400;
      err.code = "ACTIVE_ASSIGNMENTS_EXIST";
      throw err;
    }

    // Execute Soft Delete
    await tx.user.update({
      where: { id: targetUserId },
      data: { deletedAt: new Date() }
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "USER_SOFT_DELETED",
        entityType: "USER",
        entityId: targetUserId,
        metadata: {
          email: user.email,
          role: user.role
        }
      }
    });

    return {
      success: true,
      message: "Staff user account soft-deleted successfully",
      deletedUserId: targetUserId
    };
  });
};
