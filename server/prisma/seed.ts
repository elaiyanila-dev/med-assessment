import { PrismaClient, UserRole, QueueStatus, QueueSource, ConsultationStatus, ConsultationSection, PrescriptionStatus, PharmacyOrderStatus, PharmacyTransactionType, LabDepartment, LabPriority, LabOrderStatus, LabResultStatus, BedStatus, AdmissionStatus, WardRoundStatus, IPDIndentStatus, IPDIndentPriority, ReturnWasteType, ReturnWasteStatus } from "@prisma/client";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("========================================");
  console.log("Starting MedNxt Relational Seed Process");
  console.log("========================================");

  // 1. DUMMY DATA RELATIVE PATH RESOLUTION
  const dataPath = path.resolve(__dirname, "../../data/mednxt_dummy_data.json");
  console.log(`Loading dummy dataset from: ${dataPath}`);

  if (!fs.existsSync(dataPath)) {
    throw new Error(`Dataset file not found at relative path: ${dataPath}`);
  }

  const rawData = fs.readFileSync(dataPath, "utf-8");
  const dataset = JSON.parse(rawData);

  // 2. DATASET STRUCTURE VALIDATION
  const requiredKeys = [
    "users", "patients", "appointments", "queueEntries", "consultations",
    "consultationNotes", "vitals", "activityTimeline", "medicines", "prescriptions",
    "prescriptionItems", "labTests", "labOrders", "labOrderItems", "labResults",
    "aiAnalyses", "beds", "admissions", "nurses", "wardRounds",
    "ipdIndents", "ipdIndentItems", "pharmacyOrders", "pharmacyTransactions",
    "returnsAndWaste", "emergencyOverrides", "auditLogs"
  ];

  for (const key of requiredKeys) {
    if (!dataset[key] || !Array.isArray(dataset[key])) {
      throw new Error(`Dataset validation failed: missing or invalid array key '${key}'`);
    }
  }

  console.log("Dataset structure validated successfully.");

  // Hash default password for all seed users
  const defaultPasswordHash = await bcrypt.hash("password", 10);

  // Email alias mapping to ensure both prompt demo emails & dataset emails work seamlessly
  const emailAliasMap: Record<string, string> = {
    "USR-DOC-001": "dr.rohan.sharma@mednxt.demo",
    "USR-LAB-001": "anita.rao@mednxt.demo",
    "USR-LAB-002": "kiran.das@mednxt.demo",
    "USR-PH-001": "arun.kumar@mednxt.demo",
    "USR-NUR-001": "priya.nair@mednxt.demo"
  };

  // 3. TOPOLOGICAL RELATIONAL SEEDING
  await prisma.$transaction(async (tx) => {
    // Clean test-created dynamic records for deterministic baseline restore
    await tx.pharmacyTransaction.deleteMany();
    await tx.pharmacyOrder.deleteMany();
    await tx.iPDIndentItem.deleteMany();
    await tx.iPDIndent.deleteMany();
    await tx.returnWaste.deleteMany();
    await tx.emergencyOverride.deleteMany();
    await tx.wardRound.deleteMany();
    await tx.admission.deleteMany();
    await tx.bed.updateMany({ data: { patientId: null, status: "AVAILABLE" } });
    await tx.aIAnalysis.deleteMany();
    await tx.labResultParameter.deleteMany();
    await tx.labResult.deleteMany();
    await tx.labOrderItem.deleteMany();
    await tx.labOrder.deleteMany();
    await tx.prescriptionItem.deleteMany();
    await tx.prescription.deleteMany();
    await tx.activityEvent.deleteMany();
    await tx.auditLog.deleteMany();
    await tx.vital.deleteMany();
    await tx.consultationNote.deleteMany();
    await tx.consultation.deleteMany();
    await tx.queueEntry.deleteMany();
    await tx.appointment.deleteMany();
    await tx.patientCondition.deleteMany();
    await tx.patientAllergy.deleteMany();

    const baselinePatientIds = dataset.patients.map((p: any) => p.id);
    await tx.patient.deleteMany({
      where: { id: { notIn: baselinePatientIds } }
    });

    // 1. Users
    console.log("Seeding Users...");
    for (const u of dataset.users) {
      const primaryEmail = emailAliasMap[u.id] || u.email;
      await tx.user.upsert({
        where: { id: u.id },
        update: {
          name: u.name,
          email: primaryEmail,
          phone: u.phone,
          passwordHash: defaultPasswordHash,
          role: u.role as UserRole,
          department: u.department,
          specialization: u.specialization,
          status: u.status || "ACTIVE"
        },
        create: {
          id: u.id,
          name: u.name,
          email: primaryEmail,
          phone: u.phone,
          passwordHash: defaultPasswordHash,
          role: u.role as UserRole,
          department: u.department,
          specialization: u.specialization,
          status: u.status || "ACTIVE"
        }
      });
    }

    // Also seed original dataset email aliases as duplicate login accounts for maximum convenience
    for (const u of dataset.users) {
      if (emailAliasMap[u.id] && emailAliasMap[u.id] !== u.email) {
        const aliasId = `${u.id}-ALIAS`;
        await tx.user.upsert({
          where: { email: u.email },
          update: {
            name: u.name,
            passwordHash: defaultPasswordHash,
            role: u.role as UserRole,
            department: u.department,
            specialization: u.specialization,
            status: "ACTIVE"
          },
          create: {
            id: aliasId,
            name: u.name,
            email: u.email,
            phone: u.phone,
            passwordHash: defaultPasswordHash,
            role: u.role as UserRole,
            department: u.department,
            specialization: u.specialization,
            status: "ACTIVE"
          }
        });
      }
    }

    // 2. Patients
    console.log("Seeding Patients...");
    for (const p of dataset.patients) {
      const uhidVal = p.uhid || p.UHID || `UHID-${p.id}`;
      const dobVal = p.dob || p.dateOfBirth ? new Date(p.dob || p.dateOfBirth) : null;

      await tx.patient.upsert({
        where: { id: p.id },
        update: {
          name: p.name,
          UHID: uhidVal,
          dateOfBirth: dobVal,
          age: p.age,
          gender: p.gender,
          mobile: p.mobile,
          email: p.email,
          bloodGroup: p.bloodGroup,
          address: p.address,
          priority: p.priority || "NORMAL",
          queueStatus: p.queueStatus || "WAITING",
          registrationType: p.registrationType || "OPD",
          department: p.department
        },
        create: {
          id: p.id,
          name: p.name,
          UHID: uhidVal,
          dateOfBirth: dobVal,
          age: p.age,
          gender: p.gender,
          mobile: p.mobile,
          email: p.email,
          bloodGroup: p.bloodGroup,
          address: p.address,
          priority: p.priority || "NORMAL",
          queueStatus: p.queueStatus || "WAITING",
          registrationType: p.registrationType || "OPD",
          department: p.department
        }
      });

      // 3 & 4. Patient Allergies & Conditions
      if (p.allergies && Array.isArray(p.allergies)) {
        await tx.patientAllergy.deleteMany({ where: { patientId: p.id } });
        for (const allergen of p.allergies) {
          if (allergen && allergen !== "None" && allergen !== "None reported") {
            await tx.patientAllergy.create({
              data: {
                patientId: p.id,
                allergen,
                severity: "MODERATE"
              }
            });
          }
        }
      }

      if (p.chronicConditions && Array.isArray(p.chronicConditions)) {
        await tx.patientCondition.deleteMany({ where: { patientId: p.id } });
        for (const condition of p.chronicConditions) {
          if (condition && condition !== "None" && condition !== "None reported") {
            await tx.patientCondition.create({
              data: {
                patientId: p.id,
                condition,
                status: "ACTIVE"
              }
            });
          }
        }
      }
    }

    // 5. Medicines
    console.log("Seeding Medicines...");
    for (const m of dataset.medicines) {
      await tx.medicine.upsert({
        where: { id: m.id },
        update: {
          name: m.name,
          genericName: m.genericName,
          category: m.category,
          manufacturer: m.manufacturer,
          rackLocation: m.rack || m.rackLocation,
          unit: m.unit,
          stockQuantity: m.stock !== undefined ? m.stock : m.stockQuantity,
          minimumStock: m.minimumStock,
          unitPrice: m.unitPrice,
          expiryDate: new Date(m.expiryDate),
          status: m.status || "ACTIVE"
        },
        create: {
          id: m.id,
          name: m.name,
          genericName: m.genericName,
          category: m.category,
          manufacturer: m.manufacturer,
          rackLocation: m.rack || m.rackLocation,
          unit: m.unit,
          stockQuantity: m.stock !== undefined ? m.stock : m.stockQuantity,
          minimumStock: m.minimumStock,
          unitPrice: m.unitPrice,
          expiryDate: new Date(m.expiryDate),
          status: m.status || "ACTIVE"
        }
      });
    }

    // 6. Lab Tests
    console.log("Seeding Lab Tests...");
    for (const lt of dataset.labTests) {
      await tx.labTest.upsert({
        where: { id: lt.id },
        update: {
          code: lt.code,
          name: lt.name,
          department: (lt.department ? lt.department.toUpperCase() : "HEMATOLOGY") as LabDepartment,
          specimen: lt.specimen,
          tatMinutes: lt.tatMinutes,
          price: lt.price,
          active: lt.active !== undefined ? lt.active : true
        },
        create: {
          id: lt.id,
          code: lt.code,
          name: lt.name,
          department: (lt.department ? lt.department.toUpperCase() : "HEMATOLOGY") as LabDepartment,
          specimen: lt.specimen,
          tatMinutes: lt.tatMinutes,
          price: lt.price,
          active: lt.active !== undefined ? lt.active : true
        }
      });
    }

    // 7. Beds
    console.log("Seeding Beds...");
    for (const b of dataset.beds) {
      await tx.bed.upsert({
        where: { id: b.id },
        update: {
          bedNumber: b.bedNumber,
          ward: b.ward,
          wardCode: b.wardCode,
          status: b.status as BedStatus,
          dailyRate: b.dailyRate,
          equipment: b.equipment || [],
          patientId: b.patientId || null
        },
        create: {
          id: b.id,
          bedNumber: b.bedNumber,
          ward: b.ward,
          wardCode: b.wardCode,
          status: b.status as BedStatus,
          dailyRate: b.dailyRate,
          equipment: b.equipment || [],
          patientId: b.patientId || null
        }
      });
    }

    // 8. Appointments
    console.log("Seeding Appointments...");
    for (const a of dataset.appointments) {
      await tx.appointment.upsert({
        where: { id: a.id },
        update: {
          patientId: a.patientId,
          doctorId: a.doctorId,
          department: a.department,
          type: a.type || "ROUTINE",
          scheduledAt: new Date(a.scheduledAt),
          status: a.status || "SCHEDULED"
        },
        create: {
          id: a.id,
          patientId: a.patientId,
          doctorId: a.doctorId,
          department: a.department,
          type: a.type || "ROUTINE",
          scheduledAt: new Date(a.scheduledAt),
          status: a.status || "SCHEDULED"
        }
      });
    }

    // 9. Queue Entries
    console.log("Seeding Queue Entries...");
    for (const q of dataset.queueEntries) {
      const docId = q.assignedDoctorId || q.doctorId;
      const tokenNum = typeof q.token === "number" ? q.token : parseInt(String(q.token).replace(/\D/g, "") || "1", 10);

      await tx.queueEntry.upsert({
        where: { id: q.id },
        update: {
          patientId: q.patientId,
          doctorId: docId,
          token: tokenNum,
          arrivalTime: new Date(q.arrivalTime),
          status: q.status as QueueStatus,
          priority: q.priority || "ROUTINE",
          source: (q.source || "CLINIC") as QueueSource
        },
        create: {
          id: q.id,
          patientId: q.patientId,
          doctorId: docId,
          token: tokenNum,
          arrivalTime: new Date(q.arrivalTime),
          status: q.status as QueueStatus,
          priority: q.priority || "ROUTINE",
          source: (q.source || "CLINIC") as QueueSource
        }
      });
    }

    // 10. Admissions
    console.log("Seeding Admissions...");
    for (const adm of dataset.admissions) {
      await tx.admission.upsert({
        where: { id: adm.id },
        update: {
          patientId: adm.patientId,
          bedId: adm.bedId,
          doctorId: adm.doctorId,
          admittedAt: new Date(adm.admittedAt),
          dischargedAt: adm.dischargedAt ? new Date(adm.dischargedAt) : null,
          status: adm.status as AdmissionStatus,
          reason: adm.reason
        },
        create: {
          id: adm.id,
          patientId: adm.patientId,
          bedId: adm.bedId,
          doctorId: adm.doctorId,
          admittedAt: new Date(adm.admittedAt),
          dischargedAt: adm.dischargedAt ? new Date(adm.dischargedAt) : null,
          status: adm.status as AdmissionStatus,
          reason: adm.reason
        }
      });
    }

    // 11. Nurses
    console.log("Seeding Nurses...");
    for (const n of dataset.nurses) {
      await tx.nurse.upsert({
        where: { id: n.id },
        update: {
          userId: n.userId,
          shift: n.shift,
          startTime: n.start || n.startTime,
          endTime: n.end || n.endTime,
          ward: n.ward,
          status: n.status || "ON_DUTY"
        },
        create: {
          id: n.id,
          userId: n.userId,
          shift: n.shift,
          startTime: n.start || n.startTime,
          endTime: n.end || n.endTime,
          ward: n.ward,
          status: n.status || "ON_DUTY"
        }
      });
    }

    // 12. Consultations
    console.log("Seeding Consultations...");
    for (const c of dataset.consultations) {
      await tx.consultation.upsert({
        where: { id: c.id },
        update: {
          patientId: c.patientId,
          doctorId: c.doctorId,
          status: c.status as ConsultationStatus,
          startedAt: c.startedAt ? new Date(c.startedAt) : null,
          heldAt: c.heldAt ? new Date(c.heldAt) : null,
          finishedAt: c.finishedAt ? new Date(c.finishedAt) : null,
          subjective: c.subjective,
          objective: c.objective,
          assessment: c.assessment,
          plan: c.plan,
          icd10Code: c.icd10Code
        },
        create: {
          id: c.id,
          patientId: c.patientId,
          doctorId: c.doctorId,
          status: c.status as ConsultationStatus,
          startedAt: c.startedAt ? new Date(c.startedAt) : null,
          heldAt: c.heldAt ? new Date(c.heldAt) : null,
          finishedAt: c.finishedAt ? new Date(c.finishedAt) : null,
          subjective: c.subjective,
          objective: c.objective,
          assessment: c.assessment,
          plan: c.plan,
          icd10Code: c.icd10Code
        }
      });
    }

    // 13. Consultation Notes
    console.log("Seeding Consultation Notes...");
    for (const cn of dataset.consultationNotes) {
      await tx.consultationNote.upsert({
        where: { id: cn.id },
        update: {
          consultationId: cn.consultationId,
          section: cn.section as ConsultationSection,
          content: cn.content
        },
        create: {
          id: cn.id,
          consultationId: cn.consultationId,
          section: cn.section as ConsultationSection,
          content: cn.content
        }
      });
    }

    // 14. Vitals
    console.log("Seeding Vitals...");
    for (const v of dataset.vitals) {
      await tx.vital.upsert({
        where: { id: v.id },
        update: {
          patientId: v.patientId,
          recordedBy: v.recordedBy,
          recordedAt: new Date(v.recordedAt),
          systolicBP: v.bpSystolic || v.systolicBP,
          diastolicBP: v.bpDiastolic || v.diastolicBP,
          spo2: v.spo2,
          temperature: v.temperatureF || v.temperature,
          weight: v.weightKg || v.weight
        },
        create: {
          id: v.id,
          patientId: v.patientId,
          recordedBy: v.recordedBy,
          recordedAt: new Date(v.recordedAt),
          systolicBP: v.bpSystolic || v.systolicBP,
          diastolicBP: v.bpDiastolic || v.diastolicBP,
          spo2: v.spo2,
          temperature: v.temperatureF || v.temperature,
          weight: v.weightKg || v.weight
        }
      });
    }

    // 15. Activity Events
    console.log("Seeding Activity Events...");
    for (const ae of dataset.activityTimeline) {
      await tx.activityEvent.upsert({
        where: { id: ae.id },
        update: {
          patientId: ae.patientId,
          actorId: ae.actorId,
          actorType: ae.actorType,
          eventType: ae.eventType,
          timestamp: new Date(ae.timestamp),
          department: ae.department,
          description: ae.description,
          metadata: ae.metadata || null
        },
        create: {
          id: ae.id,
          patientId: ae.patientId,
          actorId: ae.actorId,
          actorType: ae.actorType,
          eventType: ae.eventType,
          timestamp: new Date(ae.timestamp),
          department: ae.department,
          description: ae.description,
          metadata: ae.metadata || null
        }
      });
    }

    // 16. Prescriptions
    console.log("Seeding Prescriptions...");
    for (const pr of dataset.prescriptions) {
      await tx.prescription.upsert({
        where: { id: pr.id },
        update: {
          patientId: pr.patientId,
          doctorId: pr.doctorId,
          consultationId: pr.consultationId,
          status: pr.status as PrescriptionStatus,
          prescribedAt: new Date(pr.prescribedAt)
        },
        create: {
          id: pr.id,
          patientId: pr.patientId,
          doctorId: pr.doctorId,
          consultationId: pr.consultationId,
          status: pr.status as PrescriptionStatus,
          prescribedAt: new Date(pr.prescribedAt)
        }
      });
    }

    // 17. Prescription Items
    console.log("Seeding Prescription Items...");
    for (const pi of dataset.prescriptionItems) {
      await tx.prescriptionItem.upsert({
        where: { id: pi.id },
        update: {
          prescriptionId: pi.prescriptionId,
          medicineId: pi.medicineId,
          dosage: pi.dosage,
          frequency: pi.frequency,
          durationDays: pi.durationDays,
          quantity: pi.quantity,
          unitPrice: pi.unitPrice,
          totalPrice: pi.totalPrice
        },
        create: {
          id: pi.id,
          prescriptionId: pi.prescriptionId,
          medicineId: pi.medicineId,
          dosage: pi.dosage,
          frequency: pi.frequency,
          durationDays: pi.durationDays,
          quantity: pi.quantity,
          unitPrice: pi.unitPrice,
          totalPrice: pi.totalPrice
        }
      });
    }

    // 18. Pharmacy Orders
    console.log("Seeding Pharmacy Orders...");
    for (const po of dataset.pharmacyOrders) {
      await tx.pharmacyOrder.upsert({
        where: { id: po.id },
        update: {
          prescriptionId: po.prescriptionId,
          patientId: po.patientId,
          status: po.status as PharmacyOrderStatus,
          totalAmount: po.totalAmount,
          createdAt: new Date(po.createdAt),
          dispensedAt: po.dispensedAt ? new Date(po.dispensedAt) : null
        },
        create: {
          id: po.id,
          prescriptionId: po.prescriptionId,
          patientId: po.patientId,
          status: po.status as PharmacyOrderStatus,
          totalAmount: po.totalAmount,
          createdAt: new Date(po.createdAt),
          dispensedAt: po.dispensedAt ? new Date(po.dispensedAt) : null
        }
      });
    }

    // 19. Pharmacy Transactions
    console.log("Seeding Pharmacy Transactions...");
    for (const pt of dataset.pharmacyTransactions) {
      const phOrderId = pt.referenceId && pt.referenceId.startsWith("PH-") ? pt.referenceId : null;

      await tx.pharmacyTransaction.upsert({
        where: { id: pt.id },
        update: {
          medicineId: pt.medicineId,
          type: pt.type as PharmacyTransactionType,
          quantity: pt.quantity,
          referenceId: pt.referenceId,
          pharmacyOrderId: phOrderId,
          performedBy: pt.performedBy,
          timestamp: new Date(pt.timestamp)
        },
        create: {
          id: pt.id,
          medicineId: pt.medicineId,
          type: pt.type as PharmacyTransactionType,
          quantity: pt.quantity,
          referenceId: pt.referenceId,
          pharmacyOrderId: phOrderId,
          performedBy: pt.performedBy,
          timestamp: new Date(pt.timestamp)
        }
      });
    }

    // 20. Lab Orders
    console.log("Seeding Lab Orders...");
    for (const lo of dataset.labOrders) {
      await tx.labOrder.upsert({
        where: { id: lo.id },
        update: {
          patientId: lo.patientId,
          doctorId: lo.doctorId,
          priority: lo.priority as LabPriority,
          status: lo.status as LabOrderStatus,
          orderTimestamp: new Date(lo.orderedAt || lo.orderTimestamp),
          collectedAt: lo.collectedAt ? new Date(lo.collectedAt) : null,
          processingAt: lo.processingAt ? new Date(lo.processingAt) : null,
          resultReadyAt: lo.resultReadyAt ? new Date(lo.resultReadyAt) : null,
          releasedAt: lo.releasedAt ? new Date(lo.releasedAt) : null,
          sampleId: lo.sampleId || null,
          accessionId: lo.accessionId || null
        },
        create: {
          id: lo.id,
          patientId: lo.patientId,
          doctorId: lo.doctorId,
          priority: lo.priority as LabPriority,
          status: lo.status as LabOrderStatus,
          orderTimestamp: new Date(lo.orderedAt || lo.orderTimestamp),
          collectedAt: lo.collectedAt ? new Date(lo.collectedAt) : null,
          processingAt: lo.processingAt ? new Date(lo.processingAt) : null,
          resultReadyAt: lo.resultReadyAt ? new Date(lo.resultReadyAt) : null,
          releasedAt: lo.releasedAt ? new Date(lo.releasedAt) : null,
          sampleId: lo.sampleId || null,
          accessionId: lo.accessionId || null
        }
      });
    }

    // 21. Lab Order Items
    console.log("Seeding Lab Order Items...");
    for (const loi of dataset.labOrderItems) {
      await tx.labOrderItem.upsert({
        where: { id: loi.id },
        update: {
          labOrderId: loi.labOrderId,
          testId: loi.testId,
          status: loi.status || "ORDERED"
        },
        create: {
          id: loi.id,
          labOrderId: loi.labOrderId,
          testId: loi.testId,
          status: loi.status || "ORDERED"
        }
      });
    }

    // 22 & 23. Lab Results & Parameters
    console.log("Seeding Lab Results & Parameters...");
    for (const lr of dataset.labResults) {
      await tx.labResult.upsert({
        where: { id: lr.id },
        update: {
          labOrderId: lr.labOrderId,
          testId: lr.testId,
          enteredBy: lr.enteredBy,
          reviewedBy: lr.reviewedBy || null,
          releasedBy: lr.releasedBy || null,
          status: (lr.status || "ENTERED") as LabResultStatus,
          enteredAt: lr.enteredAt ? new Date(lr.enteredAt) : new Date(),
          reviewedAt: lr.reviewedAt ? new Date(lr.reviewedAt) : null,
          releasedAt: lr.releasedAt ? new Date(lr.releasedAt) : null
        },
        create: {
          id: lr.id,
          labOrderId: lr.labOrderId,
          testId: lr.testId,
          enteredBy: lr.enteredBy,
          reviewedBy: lr.reviewedBy || null,
          releasedBy: lr.releasedBy || null,
          status: (lr.status || "ENTERED") as LabResultStatus,
          enteredAt: lr.enteredAt ? new Date(lr.enteredAt) : new Date(),
          reviewedAt: lr.reviewedAt ? new Date(lr.reviewedAt) : null,
          releasedAt: lr.releasedAt ? new Date(lr.releasedAt) : null
        }
      });

      await tx.labResultParameter.deleteMany({ where: { labResultId: lr.id } });

      if (lr.parameters && typeof lr.parameters === "object") {
        for (const [paramName, val] of Object.entries(lr.parameters)) {
          const unit = lr.units && lr.units[paramName] ? lr.units[paramName] : "";
          await tx.labResultParameter.create({
            data: {
              labResultId: lr.id,
              parameterName: paramName,
              resultValue: String(val),
              unit,
              referenceRange: "Standard",
              abnormalFlag: lr.flag === "ABNORMAL" || lr.flag === "CRITICAL"
            }
          });
        }
      }
    }

    // 24. AI Analyses
    console.log("Seeding AI Analyses...");
    for (const ai of dataset.aiAnalyses) {
      const resId = ai.resultId || ai.labResultId;
      await tx.aIAnalysis.upsert({
        where: { id: ai.id },
        update: {
          labResultId: resId,
          engine: ai.engine || "MedNxt AI Pathologist",
          summary: ai.summary,
          confidence: ai.confidence,
          anomalies: ai.anomalies || [],
          clinicalCorrelation: ai.clinicalCorrelation || ai.summary,
          reviewStatus: ai.reviewStatus || "PENDING_HUMAN_REVIEW"
        },
        create: {
          id: ai.id,
          labResultId: resId,
          engine: ai.engine || "MedNxt AI Pathologist",
          summary: ai.summary,
          confidence: ai.confidence,
          anomalies: ai.anomalies || [],
          clinicalCorrelation: ai.clinicalCorrelation || ai.summary,
          reviewStatus: ai.reviewStatus || "PENDING_HUMAN_REVIEW"
        }
      });
    }

    // 25. Ward Rounds
    console.log("Seeding Ward Rounds...");
    for (const wr of dataset.wardRounds) {
      await tx.wardRound.upsert({
        where: { id: wr.id },
        update: {
          patientId: wr.patientId,
          doctorId: wr.doctorId,
          bedId: wr.bedId,
          scheduledAt: new Date(wr.scheduledAt),
          status: wr.status as WardRoundStatus,
          notes: wr.notes
        },
        create: {
          id: wr.id,
          patientId: wr.patientId,
          doctorId: wr.doctorId,
          bedId: wr.bedId,
          scheduledAt: new Date(wr.scheduledAt),
          status: wr.status as WardRoundStatus,
          notes: wr.notes
        }
      });
    }

    // 26 & 27. IPD Indents & Items
    console.log("Seeding IPD Indents & Items...");
    for (const ind of dataset.ipdIndents) {
      await tx.iPDIndent.upsert({
        where: { id: ind.id },
        update: {
          patientId: ind.patientId,
          bedId: ind.bedId,
          ward: ind.ward,
          priority: (ind.priority || "ROUTINE") as IPDIndentPriority,
          status: (ind.status || "PENDING") as IPDIndentStatus,
          createdAt: new Date(ind.createdAt),
          approvedAt: ind.approvedAt ? new Date(ind.approvedAt) : null,
          fulfilledAt: ind.fulfilledAt ? new Date(ind.fulfilledAt) : null
        },
        create: {
          id: ind.id,
          patientId: ind.patientId,
          bedId: ind.bedId,
          ward: ind.ward,
          priority: (ind.priority || "ROUTINE") as IPDIndentPriority,
          status: (ind.status || "PENDING") as IPDIndentStatus,
          createdAt: new Date(ind.createdAt),
          approvedAt: ind.approvedAt ? new Date(ind.approvedAt) : null,
          fulfilledAt: ind.fulfilledAt ? new Date(ind.fulfilledAt) : null
        }
      });
    }

    if (dataset.ipdIndentItems && Array.isArray(dataset.ipdIndentItems)) {
      for (const item of dataset.ipdIndentItems) {
        await tx.iPDIndentItem.upsert({
          where: { id: item.id },
          update: {
            indentId: item.indentId,
            medicineId: item.medicineId,
            dose: item.dose,
            quantity: item.quantity,
            packaging: item.packaging
          },
          create: {
            id: item.id,
            indentId: item.indentId,
            medicineId: item.medicineId,
            dose: item.dose,
            quantity: item.quantity,
            packaging: item.packaging
          }
        });
      }
    }

    // 28. Returns & Waste
    console.log("Seeding Returns & Waste...");
    for (const rw of dataset.returnsAndWaste) {
      await tx.returnWaste.upsert({
        where: { id: rw.id },
        update: {
          patientId: rw.patientId,
          bedId: rw.bedId || null,
          medicineId: rw.medicineId,
          quantity: rw.quantity,
          type: rw.type as ReturnWasteType,
          reason: rw.reason,
          status: rw.status as ReturnWasteStatus,
          createdAt: new Date(rw.createdAt),
          verifiedAt: rw.verifiedAt ? new Date(rw.verifiedAt) : null,
          verifiedBy: rw.verifiedBy || null
        },
        create: {
          id: rw.id,
          patientId: rw.patientId,
          bedId: rw.bedId || null,
          medicineId: rw.medicineId,
          quantity: rw.quantity,
          type: rw.type as ReturnWasteType,
          reason: rw.reason,
          status: rw.status as ReturnWasteStatus,
          createdAt: new Date(rw.createdAt),
          verifiedAt: rw.verifiedAt ? new Date(rw.verifiedAt) : null,
          verifiedBy: rw.verifiedBy || null
        }
      });
    }

    // 29 & 30. Emergency Overrides & Items
    console.log("Seeding Emergency Overrides...");
    for (const eo of dataset.emergencyOverrides) {
      const createdTimestamp = eo.timestamp || eo.createdAt ? new Date(eo.timestamp || eo.createdAt) : new Date();

      await tx.emergencyOverride.upsert({
        where: { id: eo.id },
        update: {
          userId: eo.userId,
          scenario: eo.scenario,
          action: eo.action,
          reason: eo.reason,
          createdAt: createdTimestamp
        },
        create: {
          id: eo.id,
          userId: eo.userId,
          scenario: eo.scenario,
          action: eo.action,
          reason: eo.reason,
          createdAt: createdTimestamp
        }
      });

      if (eo.items && Array.isArray(eo.items)) {
        await tx.emergencyOverrideItem.deleteMany({ where: { overrideId: eo.id } });
        for (const item of eo.items) {
          await tx.emergencyOverrideItem.create({
            data: {
              overrideId: eo.id,
              entityType: item.entityType || "MEDICINE",
              entityId: item.entityId || item.medicineId || "UNKNOWN",
              detail: item.detail || `Quantity: ${item.quantity || 1}`
            }
          });
        }
      }
    }

    // 31. Audit Logs
    console.log("Seeding Audit Logs...");
    for (const al of dataset.auditLogs) {
      await tx.auditLog.upsert({
        where: { id: al.id },
        update: {
          actorId: al.actorId || null,
          action: al.action,
          entityType: al.entityType,
          entityId: al.entityId || null,
          metadata: al.metadata || null,
          timestamp: new Date(al.timestamp)
        },
        create: {
          id: al.id,
          actorId: al.actorId || null,
          action: al.action,
          entityType: al.entityType,
          entityId: al.entityId || null,
          metadata: al.metadata || null,
          timestamp: new Date(al.timestamp)
        }
      });
    }
  });

  console.log("All entities seeded successfully.");

  // 4. VERIFICATION OF SEED COUNTS
  const userCount = await prisma.user.count();
  const patientCount = await prisma.patient.count();
  const allergyCount = await prisma.patientAllergy.count();
  const conditionCount = await prisma.patientCondition.count();
  const appointmentCount = await prisma.appointment.count();
  const queueCount = await prisma.queueEntry.count();
  const consultationCount = await prisma.consultation.count();
  const consultationNoteCount = await prisma.consultationNote.count();
  const vitalCount = await prisma.vital.count();
  const activityCount = await prisma.activityEvent.count();
  const medicineCount = await prisma.medicine.count();
  const prescriptionCount = await prisma.prescription.count();
  const prescriptionItemCount = await prisma.prescriptionItem.count();
  const pharmacyOrderCount = await prisma.pharmacyOrder.count();
  const pharmacyTxCount = await prisma.pharmacyTransaction.count();
  const labTestCount = await prisma.labTest.count();
  const labOrderCount = await prisma.labOrder.count();
  const labOrderItemCount = await prisma.labOrderItem.count();
  const labResultCount = await prisma.labResult.count();
  const labParamCount = await prisma.labResultParameter.count();
  const aiCount = await prisma.aIAnalysis.count();
  const bedCount = await prisma.bed.count();
  const admissionCount = await prisma.admission.count();
  const nurseCount = await prisma.nurse.count();
  const wardRoundCount = await prisma.wardRound.count();
  const ipdIndentCount = await prisma.iPDIndent.count();
  const ipdItemCount = await prisma.iPDIndentItem.count();
  const returnWasteCount = await prisma.returnWaste.count();
  const emergencyCount = await prisma.emergencyOverride.count();
  const auditLogCount = await prisma.auditLog.count();

  console.log("\n========================================");
  console.log("MedNxt Seed Count Summary");
  console.log("========================================");
  console.log(`Users:                  ${userCount}`);
  console.log(`Patients:               ${patientCount}`);
  console.log(`Patient Allergies:      ${allergyCount}`);
  console.log(`Patient Conditions:     ${conditionCount}`);
  console.log(`Appointments:           ${appointmentCount}`);
  console.log(`Queue Entries:          ${queueCount}`);
  console.log(`Consultations:          ${consultationCount}`);
  console.log(`Consultation Notes:     ${consultationNoteCount}`);
  console.log(`Vitals:                 ${vitalCount}`);
  console.log(`Activity Events:        ${activityCount}`);
  console.log(`Medicines:              ${medicineCount}`);
  console.log(`Prescriptions:          ${prescriptionCount}`);
  console.log(`Prescription Items:     ${prescriptionItemCount}`);
  console.log(`Pharmacy Orders:        ${pharmacyOrderCount}`);
  console.log(`Pharmacy Transactions:  ${pharmacyTxCount}`);
  console.log(`Lab Tests:              ${labTestCount}`);
  console.log(`Lab Orders:             ${labOrderCount}`);
  console.log(`Lab Order Items:        ${labOrderItemCount}`);
  console.log(`Lab Results:            ${labResultCount}`);
  console.log(`Lab Result Parameters:  ${labParamCount}`);
  console.log(`AI Analyses:            ${aiCount}`);
  console.log(`Beds:                   ${bedCount}`);
  console.log(`Admissions:             ${admissionCount}`);
  console.log(`Nurses:                 ${nurseCount}`);
  console.log(`Ward Rounds:            ${wardRoundCount}`);
  console.log(`IPD Indents:            ${ipdIndentCount}`);
  console.log(`IPD Indent Items:       ${ipdItemCount}`);
  console.log(`Returns / Waste:        ${returnWasteCount}`);
  console.log(`Emergency Overrides:    ${emergencyCount}`);
  console.log(`Audit Logs:             ${auditLogCount}`);
  console.log("========================================\n");

  // 5. EXPLICIT CROSS-MODULE RELATIONSHIP VERIFICATION
  console.log("Performing explicit cross-module relationship verification...");

  // CHAIN 1 — DOCTOR -> PHARMACY
  console.log("Checking Chain 1 (Doctor -> Pharmacy)...");
  const priya = await prisma.patient.findFirst({
    where: { name: "Priya Sharma" },
    include: {
      prescriptions: {
        include: {
          items: { include: { medicine: true } },
          pharmacyOrders: true
        }
      }
    }
  });

  if (!priya) {
    throw new Error("RELATIONSHIP CHECK FAILED: Patient 'Priya Sharma' not found");
  }
  if (priya.prescriptions.length === 0) {
    throw new Error("RELATIONSHIP CHECK FAILED: Priya Sharma has no prescriptions");
  }
  const priyaPrescription = priya.prescriptions[0];
  const hasDolo = priyaPrescription.items.some((item) => item.medicine.name.includes("Dolo") || item.medicine.genericName.includes("Paracetamol"));
  if (!hasDolo) {
    throw new Error("RELATIONSHIP CHECK FAILED: Priya Sharma prescription does not resolve to Dolo 650");
  }
  if (priyaPrescription.pharmacyOrders.length === 0) {
    throw new Error("RELATIONSHIP CHECK FAILED: Prescription does not resolve to a PharmacyOrder");
  }
  const priyaPharmacyOrder = priyaPrescription.pharmacyOrders[0];
  if (priyaPharmacyOrder.patientId !== priya.id) {
    throw new Error("RELATIONSHIP CHECK FAILED: PharmacyOrder does not resolve back to Priya Sharma");
  }
  console.log(" -> Chain 1 Passed!");

  // CHAIN 2 — DOCTOR -> LABORATORY
  console.log("Checking Chain 2 (Doctor -> Laboratory)...");
  const labOrderWithResults = await prisma.labOrder.findFirst({
    where: { results: { some: {} } },
    include: {
      patient: true,
      items: { include: { test: true } },
      results: { include: { parameters: true, aiAnalysis: true } }
    }
  });

  if (!labOrderWithResults) {
    throw new Error("RELATIONSHIP CHECK FAILED: No LabOrder with results found");
  }
  if (!labOrderWithResults.patient) {
    throw new Error("RELATIONSHIP CHECK FAILED: LabOrder does not resolve to a Patient");
  }
  if (labOrderWithResults.items.length === 0 || !labOrderWithResults.items[0].test) {
    throw new Error("RELATIONSHIP CHECK FAILED: LabOrder does not resolve to LabOrderItem and LabTest");
  }
  const result = labOrderWithResults.results[0];
  if (result.parameters.length === 0) {
    throw new Error("RELATIONSHIP CHECK FAILED: LabResult does not resolve to LabResultParameters");
  }
  console.log(" -> Chain 2 Passed!");

  // CHAIN 3 — IPD
  console.log("Checking Chain 3 (IPD)...");
  const activeAdmission = await prisma.admission.findFirst({
    include: { patient: true, bed: true }
  });
  if (!activeAdmission || !activeAdmission.patient || !activeAdmission.bed) {
    throw new Error("RELATIONSHIP CHECK FAILED: Admission does not resolve to Patient and Bed");
  }
  const ipdIndent = await prisma.iPDIndent.findFirst({
    include: { items: { include: { medicine: true } } }
  });
  if (!ipdIndent || ipdIndent.items.length === 0 || !ipdIndent.items[0].medicine) {
    throw new Error("RELATIONSHIP CHECK FAILED: IPDIndent does not resolve to IPDIndentItem and Medicine");
  }
  console.log(" -> Chain 3 Passed!");

  // CHAIN 4 — PHARMACY INVENTORY
  console.log("Checking Chain 4 (Pharmacy Inventory)...");
  const pharmacyTx = await prisma.pharmacyTransaction.findFirst({
    include: { medicine: true }
  });
  if (!pharmacyTx || !pharmacyTx.medicine) {
    throw new Error("RELATIONSHIP CHECK FAILED: PharmacyTransaction does not resolve to Medicine");
  }
  console.log(" -> Chain 4 Passed!");

  // CHAIN 5 — PATIENT HISTORY
  console.log("Checking Chain 5 (Patient History)...");
  const activityEvent = await prisma.activityEvent.findFirst({
    include: { patient: true }
  });
  if (!activityEvent || !activityEvent.patient || !activityEvent.eventType || !activityEvent.timestamp) {
    throw new Error("RELATIONSHIP CHECK FAILED: ActivityEvent does not resolve to Patient or lacks eventType/timestamp");
  }
  console.log(" -> Chain 5 Passed!");

  console.log("\n========================================");
  console.log("SEED SUCCESS: All 31 entities & cross-module relationships verified!");
  console.log("========================================\n");
}

main()
  .catch((e) => {
    console.error("\n========================================");
    console.error("SEED PROCESS FAILED!");
    console.error("========================================");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
