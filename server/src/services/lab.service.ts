import { prisma } from "../utils/prisma.js";
import {
  LabOrderStatus,
  LabResultStatus,
  UserRole
} from "@prisma/client";

export const getLabDashboardData = async (
  userId: string,
  userRole: UserRole,
  query?: string,
  statusFilter?: string
) => {
  // 1. Build Doctor Scoping Clause
  const orderWhere: any = {};

  if (userRole === UserRole.DOCTOR) {
    // Physician can only access lab orders for patients within care scope
    orderWhere.OR = [
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
    orderWhere.AND = [
      {
        OR: [
          { id: { contains: term, mode: "insensitive" } },
          { sampleId: { contains: term, mode: "insensitive" } },
          { accessionId: { contains: term, mode: "insensitive" } },
          { patient: { name: { contains: term, mode: "insensitive" } } },
          { patient: { UHID: { contains: term, mode: "insensitive" } } }
        ]
      }
    ];
  }

  if (statusFilter && statusFilter !== "ALL") {
    orderWhere.status = statusFilter as LabOrderStatus;
  }

  // 2. Fetch Orders
  const orders = await prisma.labOrder.findMany({
    where: orderWhere,
    orderBy: { orderTimestamp: "desc" },
    include: {
      patient: {
        select: { id: true, name: true, UHID: true, age: true, gender: true, mobile: true }
      },
      doctor: {
        select: { id: true, name: true, role: true }
      },
      items: {
        include: { test: true }
      },
      results: {
        include: {
          test: true,
          parameters: true,
          enterer: { select: { id: true, name: true } },
          reviewer: { select: { id: true, name: true } }
        }
      }
    }
  });

  // 3. Aggregate Dashboard Metrics (across all unscoped or scoped orders)
  const allOrders = await prisma.labOrder.findMany({
    where: userRole === UserRole.DOCTOR ? { doctorId: userId } : {},
    select: { status: true }
  });

  const totalOrders = allOrders.length;
  const pendingCollection = allOrders.filter((o) => o.status === LabOrderStatus.ORDERED).length;
  const inProcessing = allOrders.filter((o) => o.status === LabOrderStatus.PROCESSING || o.status === LabOrderStatus.COLLECTED).length;
  const resultsReady = allOrders.filter((o) => o.status === LabOrderStatus.RESULT_READY).length;
  const criticalResults = allOrders.filter((o) => o.status === LabOrderStatus.CRITICAL).length;
  const releasedReports = allOrders.filter((o) => o.status === LabOrderStatus.RELEASED).length;

  return {
    metrics: {
      totalOrders,
      pendingCollection,
      inProcessing,
      resultsReady,
      criticalResults,
      releasedReports
    },
    orders: orders.map((o) => ({
      id: o.id,
      patientId: o.patient.id,
      patientName: o.patient.name,
      patientUHID: o.patient.UHID,
      patientAge: o.patient.age,
      patientGender: o.patient.gender,
      doctorName: o.doctor.name,
      priority: o.priority,
      status: o.status,
      sampleId: o.sampleId,
      accessionId: o.accessionId,
      orderTimestamp: o.orderTimestamp.toISOString(),
      collectedAt: o.collectedAt ? o.collectedAt.toISOString() : null,
      processingAt: o.processingAt ? o.processingAt.toISOString() : null,
      resultReadyAt: o.resultReadyAt ? o.resultReadyAt.toISOString() : null,
      releasedAt: o.releasedAt ? o.releasedAt.toISOString() : null,
      items: o.items.map((i) => ({
        id: i.id,
        testId: i.testId,
        testName: i.test.name,
        testCode: i.test.code,
        department: i.test.department,
        specimen: i.test.specimen,
        status: i.status
      })),
      results: o.results.map((r) => ({
        id: r.id,
        testId: r.testId,
        testName: r.test.name,
        status: r.status,
        enteredBy: r.enterer.name,
        reviewedBy: r.reviewer ? r.reviewer.name : null,
        enteredAt: r.enteredAt.toISOString(),
        parameters: r.parameters.map((p) => ({
          id: p.id,
          parameterName: p.parameterName,
          resultValue: p.resultValue,
          unit: p.unit,
          referenceRange: p.referenceRange,
          abnormalFlag: p.abnormalFlag
        }))
      }))
    }))
  };
};

export const getLabOrderDetails = async (
  userId: string,
  userRole: UserRole,
  orderId: string
) => {
  const order = await prisma.labOrder.findUnique({
    where: { id: orderId },
    include: {
      patient: {
        include: { allergies: true, conditions: true }
      },
      doctor: { select: { id: true, name: true, role: true } },
      items: { include: { test: true } },
      results: {
        include: {
          test: true,
          parameters: true,
          enterer: { select: { id: true, name: true } },
          reviewer: { select: { id: true, name: true } }
        }
      }
    }
  });

  if (!order) {
    const err: any = new Error("Laboratory order not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  // Doctor Scoping Check
  if (userRole === UserRole.DOCTOR && order.doctorId !== userId) {
    const hasRelation = await prisma.queueEntry.findFirst({
      where: { patientId: order.patientId, doctorId: userId }
    }) || await prisma.consultation.findFirst({
      where: { patientId: order.patientId, doctorId: userId }
    }) || await prisma.appointment.findFirst({
      where: { patientId: order.patientId, doctorId: userId }
    }) || await prisma.admission.findFirst({
      where: { patientId: order.patientId, doctorId: userId }
    });

    if (!hasRelation) {
      const err: any = new Error("Not authorized to access laboratory records outside physician care scope");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }
  }

  return order;
};

export const collectLabSample = async (
  actorId: string,
  orderId: string,
  sampleId?: string,
  accessionId?: string
) => {
  // Validate order existence
  const order = await prisma.labOrder.findUnique({
    where: { id: orderId },
    include: { patient: true, items: { include: { test: true } } }
  });

  if (!order) {
    const err: any = new Error("Laboratory order not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  const generatedSampleId = sampleId || `SMP-${Math.floor(100000 + Math.random() * 900000)}`;
  const generatedAccessionId = accessionId || `ACC-${Math.floor(100000 + Math.random() * 900000)}`;

  // Duplicate protection check for sampleId
  if (sampleId) {
    const existingSample = await prisma.labOrder.findUnique({ where: { sampleId } });
    if (existingSample && existingSample.id !== orderId) {
      const err: any = new Error(`Sample ID ${sampleId} is already assigned to another lab order`);
      err.statusCode = 400;
      err.code = "DUPLICATE_SAMPLE_ID";
      throw err;
    }
  }

  // Duplicate protection check for accessionId
  if (accessionId) {
    const existingAccession = await prisma.labOrder.findUnique({ where: { accessionId } });
    if (existingAccession && existingAccession.id !== orderId) {
      const err: any = new Error(`Accession ID ${accessionId} is already assigned to another lab order`);
      err.statusCode = 400;
      err.code = "DUPLICATE_ACCESSION_ID";
      throw err;
    }
  }

  return await prisma.$transaction(async (tx) => {
    // Atomic status & concurrency check
    const currentOrder = await tx.labOrder.findUnique({ where: { id: orderId } });
    if (!currentOrder || currentOrder.status !== LabOrderStatus.ORDERED) {
      const err: any = new Error(`Cannot collect sample for order in status ${currentOrder?.status || 'UNKNOWN'}. Expected status ORDERED.`);
      err.statusCode = 409;
      err.code = "INVALID_STATE_TRANSITION";
      throw err;
    }

    // Update LabOrder
    const updatedOrder = await tx.labOrder.update({
      where: { id: orderId },
      data: {
        status: LabOrderStatus.COLLECTED,
        collectedAt: new Date(),
        sampleId: generatedSampleId,
        accessionId: generatedAccessionId
      },
      include: { items: { include: { test: true } }, patient: true }
    });

    // Create AuditLog
    await tx.auditLog.create({
      data: {
        actorId,
        action: "LAB_SAMPLE_COLLECTED",
        entityType: "LabOrder",
        entityId: orderId,
        metadata: {
          patientId: order.patientId,
          sampleId: generatedSampleId,
          accessionId: generatedAccessionId,
          oldStatus: LabOrderStatus.ORDERED,
          newStatus: LabOrderStatus.COLLECTED
        }
      }
    });

    // Create ActivityEvent for Patient History
    const testNames = updatedOrder.items.map((i) => i.test.name).join(", ");
    await tx.activityEvent.create({
      data: {
        patientId: order.patientId,
        actorId,
        actorType: "LAB_TECHNICIAN",
        eventType: "LAB_SAMPLE_COLLECTED",
        timestamp: new Date(),
        department: "LABORATORY",
        description: `Specimen collected for ${testNames} (Sample ID: ${generatedSampleId})`,
        metadata: {
          labOrderId: orderId,
          sampleId: generatedSampleId,
          testNames
        }
      }
    });

    return updatedOrder;
  });
};

export const processLabOrder = async (actorId: string, orderId: string) => {
  const order = await prisma.labOrder.findUnique({
    where: { id: orderId },
    include: { patient: true, items: { include: { test: true } } }
  });

  if (!order) {
    const err: any = new Error("Laboratory order not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    // Atomic status & concurrency check
    const currentOrder = await tx.labOrder.findUnique({ where: { id: orderId } });
    if (!currentOrder || currentOrder.status !== LabOrderStatus.COLLECTED) {
      const err: any = new Error(`Cannot process order in status ${currentOrder?.status || 'UNKNOWN'}. Expected status COLLECTED.`);
      err.statusCode = 409;
      err.code = "INVALID_STATE_TRANSITION";
      throw err;
    }

    const updatedOrder = await tx.labOrder.update({
      where: { id: orderId },
      data: {
        status: LabOrderStatus.PROCESSING,
        processingAt: new Date()
      },
      include: { items: { include: { test: true } }, patient: true }
    });

    // Create AuditLog
    await tx.auditLog.create({
      data: {
        actorId,
        action: "LAB_PROCESSING_STARTED",
        entityType: "LabOrder",
        entityId: orderId,
        metadata: {
          patientId: order.patientId,
          sampleId: order.sampleId,
          oldStatus: LabOrderStatus.COLLECTED,
          newStatus: LabOrderStatus.PROCESSING
        }
      }
    });

    // Create ActivityEvent for Patient History
    await tx.activityEvent.create({
      data: {
        patientId: order.patientId,
        actorId,
        actorType: "LAB_TECHNICIAN",
        eventType: "LAB_PROCESSING_STARTED",
        timestamp: new Date(),
        department: "LABORATORY",
        description: `Laboratory processing initiated for Sample ${order.sampleId || order.id.slice(-6)}`,
        metadata: {
          labOrderId: orderId,
          sampleId: order.sampleId
        }
      }
    });

    return updatedOrder;
  });
};

export const recordLabResults = async (
  actorId: string,
  orderId: string,
  payload: {
    results: Array<{
      testId: string;
      parameters: Array<{
        parameterName: string;
        resultValue: string;
        unit: string;
        referenceRange: string;
        abnormalFlag?: boolean;
      }>;
      isCritical?: boolean;
    }>;
  }
) => {
  const order = await prisma.labOrder.findUnique({
    where: { id: orderId },
    include: { patient: true, items: { include: { test: true } } }
  });

  if (!order) {
    const err: any = new Error("Laboratory order not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  // Validate test belonging
  const validTestIds = new Set(order.items.map((i) => i.testId));
  for (const r of payload.results) {
    if (!validTestIds.has(r.testId)) {
      const err: any = new Error(`Test ID ${r.testId} does not belong to LabOrder ${orderId}`);
      err.statusCode = 400;
      err.code = "INVALID_TEST_BELONGING";
      throw err;
    }

    // Check duplicate result creation
    const existingResult = await prisma.labResult.findFirst({
      where: { labOrderId: orderId, testId: r.testId }
    });

    if (existingResult) {
      const err: any = new Error(`Lab result already exists for test ID ${r.testId} in LabOrder ${orderId}`);
      err.statusCode = 400;
      err.code = "DUPLICATE_LAB_RESULT";
      throw err;
    }
  }

  let hasExplicitCritical = false;

  return await prisma.$transaction(async (tx) => {
    // Atomic status check
    const currentOrder = await tx.labOrder.findUnique({ where: { id: orderId } });
    if (!currentOrder || currentOrder.status !== LabOrderStatus.PROCESSING) {
      const err: any = new Error(`Cannot record results for order in status ${currentOrder?.status || 'UNKNOWN'}. Expected status PROCESSING.`);
      err.statusCode = 409;
      err.code = "INVALID_STATE_TRANSITION";
      throw err;
    }

    const createdResults: any[] = [];

    for (const r of payload.results) {
      if (r.isCritical) {
        hasExplicitCritical = true;
      }

      const resultRecord = await tx.labResult.create({
        data: {
          labOrderId: orderId,
          testId: r.testId,
          enteredBy: actorId,
          status: LabResultStatus.ENTERED,
          enteredAt: new Date(),
          parameters: {
            create: r.parameters.map((p) => ({
              parameterName: p.parameterName,
              resultValue: p.resultValue,
              unit: p.unit,
              referenceRange: p.referenceRange,
              abnormalFlag: p.abnormalFlag || false
            }))
          }
        },
        include: { parameters: true, test: true }
      });

      createdResults.push(resultRecord);
    }

    const newOrderStatus = hasExplicitCritical ? LabOrderStatus.CRITICAL : LabOrderStatus.RESULT_READY;

    // Update LabOrder status
    const updatedOrder = await tx.labOrder.update({
      where: { id: orderId },
      data: {
        status: newOrderStatus,
        resultReadyAt: new Date()
      },
      include: { items: { include: { test: true } }, results: { include: { parameters: true } }, patient: true }
    });

    // Create AuditLog
    await tx.auditLog.create({
      data: {
        actorId,
        action: "LAB_RESULT_CREATED",
        entityType: "LabOrder",
        entityId: orderId,
        metadata: {
          patientId: order.patientId,
          isCritical: hasExplicitCritical,
          resultsCount: createdResults.length,
          newStatus: newOrderStatus
        }
      }
    });

    // Create ActivityEvent for Patient History
    const eventType = hasExplicitCritical ? "LAB_CRITICAL_RESULT_RECORDED" : "LAB_RESULT_READY";
    const description = hasExplicitCritical
      ? `Critical laboratory report recorded for ${updatedOrder.items.map((i) => i.test.name).join(", ")}`
      : `Laboratory test parameters recorded for ${updatedOrder.items.map((i) => i.test.name).join(", ")}`;

    await tx.activityEvent.create({
      data: {
        patientId: order.patientId,
        actorId,
        actorType: "LAB_TECHNICIAN",
        eventType,
        timestamp: new Date(),
        department: "LABORATORY",
        description,
        metadata: {
          labOrderId: orderId,
          isCritical: hasExplicitCritical,
          newStatus: newOrderStatus
        }
      }
    });

    return updatedOrder;
  });
};

export const verifyLabResult = async (
  actorId: string,
  resultId: string,
  targetStatus: "REVIEWED" | "RELEASED"
) => {
  const result = await prisma.labResult.findUnique({
    where: { id: resultId },
    include: { labOrder: { include: { patient: true } }, test: true }
  });

  if (!result) {
    const err: any = new Error("Laboratory result record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    const currentResult = await tx.labResult.findUnique({ where: { id: resultId } });

    if (targetStatus === "REVIEWED") {
      if (currentResult?.status === LabResultStatus.REVIEWED || currentResult?.status === LabResultStatus.RELEASED) {
        const err: any = new Error(`Result is already in status ${currentResult.status}`);
        err.statusCode = 400;
        err.code = "DUPLICATE_REVIEW";
        throw err;
      }

      const updatedResult = await tx.labResult.update({
        where: { id: resultId },
        data: {
          status: LabResultStatus.REVIEWED,
          reviewedBy: actorId,
          reviewedAt: new Date()
        },
        include: { test: true, parameters: true }
      });

      // Audit & Activity Event
      await tx.auditLog.create({
        data: {
          actorId,
          action: "LAB_RESULT_VERIFIED",
          entityType: "LabResult",
          entityId: resultId,
          metadata: {
            targetStatus: "REVIEWED",
            testId: result.testId
          }
        }
      });

      await tx.activityEvent.create({
        data: {
          patientId: result.labOrder.patientId,
          actorId,
          actorType: "PATHOLOGIST",
          eventType: "LAB_RESULT_REVIEWED",
          timestamp: new Date(),
          department: "LABORATORY",
          description: `Laboratory report reviewed by pathologist for ${result.test.name}`,
          metadata: {
            resultId,
            labOrderId: result.labOrderId
          }
        }
      });

      return updatedResult;
    } else {
      // targetStatus === "RELEASED"
      if (currentResult?.status === LabResultStatus.RELEASED) {
        const err: any = new Error("Result has already been released");
        err.statusCode = 400;
        err.code = "DUPLICATE_RELEASE";
        throw err;
      }

      if (currentResult?.status !== LabResultStatus.REVIEWED) {
        const err: any = new Error(`Cannot release result in status ${currentResult?.status || 'UNKNOWN'}. Result must be in REVIEWED status before release.`);
        err.statusCode = 400;
        err.code = "INVALID_RESULT_STATE_TRANSITION";
        throw err;
      }

      const updatedResult = await tx.labResult.update({
        where: { id: resultId },
        data: {
          status: LabResultStatus.RELEASED,
          releasedBy: actorId,
          releasedAt: new Date()
        },
        include: { test: true, parameters: true }
      });

      // Update associated LabOrder to RELEASED
      await tx.labOrder.update({
        where: { id: result.labOrderId },
        data: {
          status: LabOrderStatus.RELEASED,
          releasedAt: new Date()
        }
      });

      // Audit & Activity Event
      await tx.auditLog.create({
        data: {
          actorId,
          action: "LAB_RESULT_VERIFIED",
          entityType: "LabResult",
          entityId: resultId,
          metadata: {
            targetStatus: "RELEASED",
            testId: result.testId
          }
        }
      });

      await tx.activityEvent.create({
        data: {
          patientId: result.labOrder.patientId,
          actorId,
          actorType: "PATHOLOGIST",
          eventType: "LAB_RESULT_RELEASED",
          timestamp: new Date(),
          department: "LABORATORY",
          description: `Final laboratory report released for ${result.test.name}`,
          metadata: {
            resultId,
            labOrderId: result.labOrderId
          }
        }
      });

      return updatedResult;
    }
  });
};
