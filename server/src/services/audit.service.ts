import { prisma } from "../utils/prisma.js";
import { UserRole } from "@prisma/client";

export const getAuditLogsList = async (
  actorId: string,
  actorRole: UserRole,
  options: {
    search?: string;
    action?: string;
    entityType?: string;
    filterActorId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}
) => {
  if (actorRole !== UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
    const err: any = new Error("User role is not authorized to access system audit logs");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 20;
  const skip = (page - 1) * limit;

  const whereClause: any = {};

  if (options.action && options.action.trim() !== "" && options.action !== "ALL") {
    whereClause.action = options.action.trim();
  }

  if (options.entityType && options.entityType.trim() !== "" && options.entityType !== "ALL") {
    whereClause.entityType = options.entityType.trim();
  }

  if (options.filterActorId && options.filterActorId.trim() !== "" && options.filterActorId !== "ALL") {
    whereClause.actorId = options.filterActorId.trim();
  }

  if (options.search && options.search.trim() !== "") {
    const term = options.search.trim();
    whereClause.OR = [
      { action: { contains: term, mode: "insensitive" } },
      { entityType: { contains: term, mode: "insensitive" } },
      { entityId: { contains: term, mode: "insensitive" } },
      { actor: { name: { contains: term, mode: "insensitive" } } },
      { actor: { email: { contains: term, mode: "insensitive" } } }
    ];
  }

  if (options.startDate || options.endDate) {
    whereClause.timestamp = {};
    if (options.startDate) {
      whereClause.timestamp.gte = new Date(options.startDate);
    }
    if (options.endDate) {
      whereClause.timestamp.lte = new Date(options.endDate);
    }
  }

  const [totalCount, logs] = await Promise.all([
    prisma.auditLog.count({ where: whereClause }),
    prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { timestamp: "desc" },
      skip,
      take: limit,
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true }
        }
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
      actorId: log.actorId,
      actorName: log.actor ? log.actor.name : "System / Unattributed",
      actorEmail: log.actor ? log.actor.email : null,
      actorRole: log.actor ? log.actor.role : null,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      timestamp: log.timestamp.toISOString()
    }))
  };
};
