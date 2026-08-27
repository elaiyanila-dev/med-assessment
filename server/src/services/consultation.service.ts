import { prisma } from "../utils/prisma.js";
import { ConsultationStatus, QueueStatus, ConsultationSection, UserRole, LabPriority, LabOrderStatus, PrescriptionStatus } from "@prisma/client";

export const getActiveConsultationForPatient = async (
  userId: string,
  userRole: UserRole,
  patientId: string,
  queueId?: string
) => {
  if (userRole !== UserRole.DOCTOR) {
    const err: any = new Error("Not authorized to access clinical consultation workspace");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  // 1. Verify Queue ownership if queueId supplied
  if (queueId) {
    const queueEntry = await prisma.queueEntry.findUnique({
      where: { id: queueId }
    });

    if (!queueEntry || queueEntry.doctorId !== userId) {
      const err: any = new Error("Queue entry not found or unauthorized for current physician");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }
  }

  // 2. READ-ONLY: Find existing active consultation
  const consultation = await prisma.consultation.findFirst({
    where: {
      patientId,
      doctorId: userId,
      status: { in: [ConsultationStatus.READY, ConsultationStatus.IN_PROGRESS, ConsultationStatus.ON_HOLD] }
    },
    orderBy: { createdAt: "desc" },
    include: {
      notes: true,
      prescriptions: {
        include: {
          items: {
            include: { medicine: true }
          }
        }
      }
    }
  });

  // 3. Fetch related lab orders for this patient/doctor
  const labOrders = await prisma.labOrder.findMany({
    where: { patientId, doctorId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { test: true }
      },
      results: {
        include: {
          parameters: true,
          enterer: { select: { id: true, name: true } },
          reviewer: { select: { id: true, name: true } }
        }
      }
    }
  });

  // 4. Fetch latest vitals for patient
  const latestVital = await prisma.vital.findFirst({
    where: { patientId },
    orderBy: { recordedAt: "desc" }
  });

  return {
    consultation,
    latestVital,
    labOrders
  };
};

export const startConsultationSession = async (
  userId: string,
  userRole: UserRole,
  patientId: string,
  queueId?: string
) => {
  if (userRole !== UserRole.DOCTOR) {
    const err: any = new Error("Not authorized to start clinical consultation");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  // 1. Verify Queue entry if queueId supplied
  let queueEntry: any = null;
  if (queueId) {
    queueEntry = await prisma.queueEntry.findUnique({
      where: { id: queueId }
    });

    if (!queueEntry || queueEntry.doctorId !== userId) {
      const err: any = new Error("Queue entry not found or unauthorized for current physician");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }

    if (queueEntry.patientId !== patientId) {
      const err: any = new Error("Queue entry does not match specified patient");
      err.statusCode = 400;
      err.code = "BAD_REQUEST";
      throw err;
    }
  }

  // 2. Check whether an active consultation already exists
  let consultation = await prisma.consultation.findFirst({
    where: {
      patientId,
      doctorId: userId,
      status: { in: [ConsultationStatus.READY, ConsultationStatus.IN_PROGRESS, ConsultationStatus.ON_HOLD] }
    },
    orderBy: { createdAt: "desc" },
    include: {
      notes: true,
      prescriptions: {
        include: {
          items: {
            include: { medicine: true }
          }
        }
      }
    }
  });

  // 3. If no active consultation exists, create one inside a Prisma $transaction
  if (!consultation) {
    consultation = await prisma.$transaction(async (tx) => {
      const newConsultation = await tx.consultation.create({
        data: {
          patientId,
          doctorId: userId,
          status: ConsultationStatus.IN_PROGRESS,
          startedAt: new Date()
        },
        include: {
          notes: true,
          prescriptions: {
            include: {
              items: {
                include: { medicine: true }
              }
            }
          }
        }
      });

      // Update QueueEntry to IN_CONSULTATION if applicable
      if (queueEntry && (queueEntry.status === QueueStatus.WAITING || queueEntry.status === QueueStatus.CHECKED_IN)) {
        await tx.queueEntry.update({
          where: { id: queueEntry.id },
          data: { status: QueueStatus.IN_CONSULTATION }
        });
      }

      // Log AuditLog & ActivityEvent
      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: "CONSULTATION_STARTED",
          entityType: "Consultation",
          entityId: newConsultation.id,
          metadata: { patientId, queueId: queueEntry?.id }
        }
      });

      await tx.activityEvent.create({
        data: {
          patientId,
          actorId: userId,
          eventType: "CONSULTATION_STARTED",
          description: "Doctor started OPD consultation"
        }
      });

      return newConsultation;
    });
  } else if (queueEntry && (queueEntry.status === QueueStatus.WAITING || queueEntry.status === QueueStatus.CHECKED_IN)) {
    // If consultation exists but queue entry status was still waiting/checked_in, update queue entry
    await prisma.queueEntry.update({
      where: { id: queueEntry.id },
      data: { status: QueueStatus.IN_CONSULTATION }
    });
  }

  // 4. Fetch related lab orders and latest vitals
  const labOrders = await prisma.labOrder.findMany({
    where: { patientId, doctorId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { test: true }
      }
    }
  });

  const latestVital = await prisma.vital.findFirst({
    where: { patientId },
    orderBy: { recordedAt: "desc" }
  });

  return {
    consultation,
    latestVital,
    labOrders
  };
};

export const saveVitalsRecord = async (
  userId: string,
  consultationId: string,
  vitalsData: {
    systolicBP?: number;
    diastolicBP?: number;
    spo2?: number;
    temperature?: number;
    weight?: number;
  }
) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId }
  });

  if (!consultation) {
    const err: any = new Error("Consultation record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  if (consultation.doctorId !== userId) {
    const err: any = new Error("Not authorized to record vitals for another doctor's consultation");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  const [savedVital] = await prisma.$transaction([
    prisma.vital.create({
      data: {
        patientId: consultation.patientId,
        recordedBy: userId,
        recordedAt: new Date(),
        systolicBP: vitalsData.systolicBP || null,
        diastolicBP: vitalsData.diastolicBP || null,
        spo2: vitalsData.spo2 || null,
        temperature: vitalsData.temperature || null,
        weight: vitalsData.weight || null
      }
    }),
    prisma.auditLog.create({
      data: {
        actorId: userId,
        action: "VITAL_RECORDED",
        entityType: "Vital",
        entityId: consultationId,
        metadata: { consultationId, patientId: consultation.patientId }
      }
    }),
    prisma.activityEvent.create({
      data: {
        patientId: consultation.patientId,
        actorId: userId,
        eventType: "VITAL_RECORDED",
        description: `Vitals recorded: BP ${vitalsData.systolicBP || "--"}/${vitalsData.diastolicBP || "--"}, SpO2 ${vitalsData.spo2 || "--"}`
      }
    })
  ]);

  return savedVital;
};

export const saveConsultationNotesRecord = async (
  userId: string,
  consultationId: string,
  notesData: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    icd10Code?: string;
  }
) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId }
  });

  if (!consultation) {
    const err: any = new Error("Consultation record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  if (consultation.doctorId !== userId) {
    const err: any = new Error("Not authorized to update notes for another doctor's consultation");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  const updatedConsultation = await prisma.consultation.update({
    where: { id: consultationId },
    data: {
      subjective: notesData.subjective ?? consultation.subjective,
      objective: notesData.objective ?? consultation.objective,
      assessment: notesData.assessment ?? consultation.assessment,
      plan: notesData.plan ?? consultation.plan,
      icd10Code: notesData.icd10Code ?? consultation.icd10Code
    }
  });

  // Upsert ConsultationNote for section if text present
  const sectionsMap: Array<{ section: ConsultationSection; content?: string }> = [
    { section: ConsultationSection.SUBJECTIVE, content: notesData.subjective },
    { section: ConsultationSection.OBJECTIVE, content: notesData.objective },
    { section: ConsultationSection.ASSESSMENT, content: notesData.assessment },
    { section: ConsultationSection.PLAN, content: notesData.plan }
  ];

  for (const item of sectionsMap) {
    if (item.content && item.content.trim() !== "") {
      const existingNote = await prisma.consultationNote.findFirst({
        where: { consultationId, section: item.section }
      });
      if (existingNote) {
        await prisma.consultationNote.update({
          where: { id: existingNote.id },
          data: { content: item.content }
        });
      } else {
        await prisma.consultationNote.create({
          data: {
            consultationId,
            section: item.section,
            content: item.content
          }
        });
      }
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "CONSULTATION_NOTES_UPDATED",
      entityType: "Consultation",
      entityId: consultationId,
      metadata: { patientId: consultation.patientId }
    }
  });

  return updatedConsultation;
};

export const searchMedicinesList = async (query?: string) => {
  const whereClause: any = {
    status: "ACTIVE"
  };

  if (query && query.trim() !== "") {
    const term = query.trim();
    whereClause.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { genericName: { contains: term, mode: "insensitive" } },
      { category: { contains: term, mode: "insensitive" } }
    ];
  }

  const medicines = await prisma.medicine.findMany({
    where: whereClause,
    orderBy: { name: "asc" },
    take: 20
  });

  return medicines;
};

export const createPrescriptionRecord = async (
  userId: string,
  consultationId: string,
  items: Array<{
    medicineId: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    quantity: number;
  }>
) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId }
  });

  if (!consultation) {
    const err: any = new Error("Consultation record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  if (consultation.doctorId !== userId) {
    const err: any = new Error("Not authorized to issue prescription for another doctor's consultation");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  if (!items || items.length === 0) {
    const err: any = new Error("At least one prescription medicine item is required");
    err.statusCode = 400;
    err.code = "BAD_REQUEST";
    throw err;
  }

  // Fetch medicines to get prices
  const medicineIds = items.map((i) => i.medicineId);
  const medicines = await prisma.medicine.findMany({
    where: { id: { in: medicineIds } }
  });

  const medicineMap = new Map(medicines.map((m) => [m.id, m]));

  const createdPrescription = await prisma.$transaction(async (tx) => {
    const rx = await tx.prescription.create({
      data: {
        patientId: consultation.patientId,
        doctorId: userId,
        consultationId: consultationId,
        status: PrescriptionStatus.SENT_TO_PHARMACY,
        prescribedAt: new Date()
      }
    });

    for (const item of items) {
      const med = medicineMap.get(item.medicineId);
      const unitPrice = med ? med.unitPrice : 10.0;
      const totalPrice = unitPrice * item.quantity;

      await tx.prescriptionItem.create({
        data: {
          prescriptionId: rx.id,
          medicineId: item.medicineId,
          dosage: item.dosage,
          frequency: item.frequency,
          durationDays: item.durationDays,
          quantity: item.quantity,
          unitPrice,
          totalPrice
        }
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: userId,
        action: "PRESCRIPTION_CREATED",
        entityType: "Prescription",
        entityId: rx.id,
        metadata: { consultationId, patientId: consultation.patientId, itemsCount: items.length }
      }
    });

    await tx.activityEvent.create({
      data: {
        patientId: consultation.patientId,
        actorId: userId,
        eventType: "PRESCRIPTION_CREATED",
        description: `Prescribed ${items.length} medication(s) sent to pharmacy`
      }
    });

    return rx;
  });

  return await prisma.prescription.findUnique({
    where: { id: createdPrescription.id },
    include: {
      items: {
        include: { medicine: true }
      }
    }
  });
};

export const getAvailableLabTestsList = async () => {
  const tests = await prisma.labTest.findMany({
    where: { active: true, deletedAt: null },
    orderBy: { name: "asc" }
  });
  return tests;
};

export const createLabOrderRecord = async (
  userId: string,
  consultationId: string,
  testIds: string[],
  priority: LabPriority = LabPriority.ROUTINE
) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId }
  });

  if (!consultation) {
    const err: any = new Error("Consultation record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  if (consultation.doctorId !== userId) {
    const err: any = new Error("Not authorized to order lab tests for another doctor's consultation");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  if (!testIds || testIds.length === 0) {
    const err: any = new Error("At least one laboratory test selection is required");
    err.statusCode = 400;
    err.code = "BAD_REQUEST";
    throw err;
  }

  const sampleId = `SMP-${Date.now().toString().slice(-6)}`;
  const accessionId = `ACC-${Date.now().toString().slice(-6)}`;

  const createdOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.labOrder.create({
      data: {
        patientId: consultation.patientId,
        doctorId: userId,
        priority,
        status: LabOrderStatus.ORDERED,
        orderTimestamp: new Date(),
        sampleId,
        accessionId
      }
    });

    for (const testId of testIds) {
      await tx.labOrderItem.create({
        data: {
          labOrderId: order.id,
          testId,
          status: "ORDERED"
        }
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: userId,
        action: "LAB_ORDER_CREATED",
        entityType: "LabOrder",
        entityId: order.id,
        metadata: { consultationId, patientId: consultation.patientId, testsCount: testIds.length }
      }
    });

    await tx.activityEvent.create({
      data: {
        patientId: consultation.patientId,
        actorId: userId,
        eventType: "LAB_ORDER_CREATED",
        description: `Ordered ${testIds.length} lab test(s) with ${priority} priority`
      }
    });

    return order;
  });

  return await prisma.labOrder.findUnique({
    where: { id: createdOrder.id },
    include: {
      items: {
        include: { test: true }
      }
    }
  });
};

export const finishConsultationRecord = async (
  userId: string,
  consultationId: string,
  queueId?: string
) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId }
  });

  if (!consultation) {
    const err: any = new Error("Consultation record not found");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  if (consultation.doctorId !== userId) {
    const err: any = new Error("Not authorized to finish another doctor's consultation");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  // Find associated queue entry if not explicitly passed
  let targetQueueEntryId = queueId;
  if (!targetQueueEntryId) {
    const activeQueue = await prisma.queueEntry.findFirst({
      where: {
        patientId: consultation.patientId,
        doctorId: userId,
        status: { in: [QueueStatus.IN_CONSULTATION, QueueStatus.CHECKED_IN, QueueStatus.WAITING] }
      },
      orderBy: { arrivalTime: "desc" }
    });
    if (activeQueue) {
      targetQueueEntryId = activeQueue.id;
    }
  }

  // Perform full Finish transaction
  const [completedConsultation] = await prisma.$transaction([
    prisma.consultation.update({
      where: { id: consultationId },
      data: {
        status: ConsultationStatus.COMPLETED,
        finishedAt: new Date()
      }
    }),
    ...(targetQueueEntryId
      ? [
          prisma.queueEntry.update({
            where: { id: targetQueueEntryId },
            data: { status: QueueStatus.COMPLETED }
          })
        ]
      : []),
    prisma.appointment.updateMany({
      where: {
        patientId: consultation.patientId,
        doctorId: userId,
        status: "CHECKED_IN"
      },
      data: { status: "COMPLETED" }
    }),
    prisma.auditLog.create({
      data: {
        actorId: userId,
        action: "CONSULTATION_COMPLETED",
        entityType: "Consultation",
        entityId: consultationId,
        metadata: {
          patientId: consultation.patientId,
          queueId: targetQueueEntryId || null
        }
      }
    }),
    prisma.activityEvent.create({
      data: {
        patientId: consultation.patientId,
        actorId: userId,
        eventType: "CONSULTATION_COMPLETED",
        description: "OPD Consultation completed by physician"
      }
    })
  ]);

  return completedConsultation;
};
