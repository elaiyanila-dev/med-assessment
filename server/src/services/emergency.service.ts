import { prisma } from "../utils/prisma.js";
import { UserRole } from "@prisma/client";

export interface EmergencyOverridePayload {
  scenario: string;
  action: string;
  reason: string;
  patientId?: string;
  items?: Array<{
    entityType: string;
    entityId: string;
    detail: string;
  }>;
}

export const createEmergencyOverrideRecord = async (
  actorId: string,
  actorRole: UserRole,
  payload: EmergencyOverridePayload
) => {
  if (
    actorRole !== UserRole.DOCTOR &&
    actorRole !== UserRole.ADMIN &&
    actorRole !== UserRole.SUPER_ADMIN
  ) {
    const err: any = new Error("Not authorized to execute emergency overrides");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  if (!payload.reason || payload.reason.trim() === "") {
    const err: any = new Error("Emergency override reason is mandatory");
    err.statusCode = 400;
    err.code = "BAD_REQUEST";
    throw err;
  }

  if (!payload.scenario || payload.scenario.trim() === "") {
    const err: any = new Error("Emergency scenario description is required");
    err.statusCode = 400;
    err.code = "BAD_REQUEST";
    throw err;
  }

  if (!payload.action || payload.action.trim() === "") {
    const err: any = new Error("Emergency action description is required");
    err.statusCode = 400;
    err.code = "BAD_REQUEST";
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Create EmergencyOverride record
    const overrideRecord = await tx.emergencyOverride.create({
      data: {
        userId: actorId,
        scenario: payload.scenario.trim(),
        action: payload.action.trim(),
        reason: payload.reason.trim(),
        items: payload.items && payload.items.length > 0
          ? {
              create: payload.items.map((item) => ({
                entityType: item.entityType,
                entityId: item.entityId,
                detail: item.detail
              }))
            }
          : undefined
      },
      include: {
        items: true,
        user: { select: { id: true, name: true, role: true } }
      }
    });

    // 2. Log AuditLog
    await tx.auditLog.create({
      data: {
        actorId,
        action: "EMERGENCY_OVERRIDE_EXECUTED",
        entityType: "EmergencyOverride",
        entityId: overrideRecord.id,
        metadata: {
          scenario: overrideRecord.scenario,
          action: overrideRecord.action,
          reason: overrideRecord.reason,
          patientId: payload.patientId || null,
          itemsCount: overrideRecord.items.length
        }
      }
    });

    // 3. Log ActivityEvent if patientId supplied
    if (payload.patientId) {
      await tx.activityEvent.create({
        data: {
          patientId: payload.patientId,
          actorId,
          actorType: actorRole,
          eventType: "EMERGENCY_OVERRIDE",
          timestamp: new Date(),
          department: "EMERGENCY",
          description: `Emergency override executed by ${overrideRecord.user.name}: ${overrideRecord.action}`,
          metadata: {
            overrideId: overrideRecord.id,
            reason: overrideRecord.reason,
            scenario: overrideRecord.scenario
          }
        }
      });
    }

    return overrideRecord;
  });
};

export const getEmergencyLogsList = async (
  actorId: string,
  actorRole: UserRole,
  options: { page?: number; limit?: number } = {}
) => {
  if (actorRole !== UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
    const err: any = new Error("User role is not authorized to view emergency override logs");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 20;
  const skip = (page - 1) * limit;

  const [totalCount, logs] = await Promise.all([
    prisma.emergencyOverride.count(),
    prisma.emergencyOverride.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        items: true
      }
    })
  ]);

  return {
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    },
    logs: logs.map((log) => ({
      id: log.id,
      user: log.user,
      scenario: log.scenario,
      action: log.action,
      reason: log.reason,
      createdAt: log.createdAt.toISOString(),
      items: log.items
    }))
  };
};
