import rawDummyData from "./mednxt_realistic_dummy_data_v2/mednxt_dummy_data.json";

export interface User {
  id: string;
  name: string;
  role: string;
  department: string;
  specialization?: string;
  phone: string;
  email: string;
  status: string;
}

export interface Patient {
  id: string;
  name: string;
  uhid: string;
  age: number;
  gender: string;
  dob: string;
  mobile: string;
  email: string;
  bloodGroup: string;
  address: string;
  allergies: string[];
  chronicConditions: string[];
  priority: string;
  queueStatus: string;
  registrationType: string;
  department: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  department: string;
  type: string;
  scheduledAt: string;
  status: string;
  patientName?: string;
}

export interface QueueEntry {
  id: string;
  patientId: string;
  arrivalTime: string;
  token: string;
  status: string;
  priority: string;
  assignedDoctorId: string;
  source: string;
  patientName?: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  status: string;
  startedAt: string;
  heldAt: string | null;
  finishedAt: string | null;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icd10Code?: string;
  icd10?: string;
}

export interface Vital {
  id: string;
  patientId: string;
  recordedBy?: string;
  recordedAt: string;
  bpSystolic?: number;
  bpDiastolic?: number;
  bloodPressure?: string;
  heartRate?: number;
  spo2?: number;
  spO2?: number;
  temperatureF?: number;
  temperature?: number;
  weightKg?: number;
  weight?: number;
}

export interface Bed {
  id: string;
  bedNumber: string;
  ward: string;
  wardCode: string;
  status: string;
  dailyRate: number;
  equipment: string[];
  patientId: string | null;
}

export interface Admission {
  id: string;
  patientId: string;
  bedId: string;
  doctorId: string;
  admittedAt: string;
  dischargedAt: string | null;
  status: string;
  reason: string;
}

export interface Nurse {
  id: string;
  userId: string;
  name: string;
  shift: string;
  start: string;
  end: string;
  ward: string;
  patientsAssigned: number;
  status: string;
}

export interface WardRound {
  id: string;
  patientId: string;
  doctorId: string;
  bedId: string;
  scheduledAt: string;
  status: string;
  notes: string | null;
}

export interface IPDIndent {
  id: string;
  patientId: string;
  bedId: string;
  ward: string;
  status: string;
  priority: string;
  createdAt: string;
}

export interface IPDIndentItem {
  id: string;
  indentId: string;
  medicineId: string;
  dose: string;
  quantity: number;
  packaging: string;
}

// Deep clone helper for session state resetting
const cloneData = (data: any) => JSON.parse(JSON.stringify(data));
const PROCESSED_RETURNS_STORAGE_KEY = "mednxt_processed_return_requests";
const FULFILLED_INDENTS_STORAGE_KEY = "mednxt_fulfilled_ipd_indents";

type ProcessedReturnRecord = {
  status: string;
  action: "restock" | "dispose" | "reject";
  processedAt: string;
};

type FulfilledIndentRecord = {
  status: "FULFILLED";
  fulfilledAt: string;
};

const canUseLocalStorage = () => typeof window !== "undefined" && !!window.localStorage;

class MedNxtDummyDataRepository {
  private data: typeof rawDummyData;

  constructor() {
    this.data = cloneData(rawDummyData);
    this.applyPersistedIndentFulfillment();
    this.applyPersistedReturnProcessing();
    this.validateRelationships();
  }

  public reset() {
    this.data = cloneData(rawDummyData);
    this.applyPersistedIndentFulfillment();
    this.applyPersistedReturnProcessing();
  }

  public get raw() {
    return this.data;
  }

  public getAuditLogs() {
    return this.data.auditLogs || [];
  }

  public getEmergencyOverrides() {
    return this.data.emergencyOverrides || [];
  }

  // --- User Selectors ---
  public getUsers(): User[] {
    return (this.data.users || []) as User[];
  }

  public getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    if (!email) return undefined;
    const e = email.toLowerCase().trim();
    return (
      this.getUsers().find((u) => u.email.toLowerCase() === e) ||
      this.getUsers().find((u) => {
        const uEmail = u.email.toLowerCase();
        if (e.includes("rohan") && (uEmail.includes("sharma") || u.id === "USR-DOC-001")) return true;
        if (e.includes("priya") && (uEmail.includes("priya") || u.id === "USR-NUR-001")) return true;
        if (e.includes("arun") && (uEmail.includes("arun") || u.id === "USR-PH-001")) return true;
        if (e.includes("anita") && (uEmail.includes("anita") || u.id === "USR-LAB-001")) return true;
        return false;
      })
    );
  }

  // --- Patient Master Selectors ---
  public getPatients(): Patient[] {
    return (this.data.patients || []) as Patient[];
  }

  public getPatientById(id: string): Patient | undefined {
    return this.getPatients().find((p) => p.id === id);
  }

  public searchPatients(query: string): any[] {
    const list = this.getPatients();
    const q = query ? query.toLowerCase().trim() : "";
    const filtered = q
      ? list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.uhid.toLowerCase().includes(q) ||
            (p.mobile || "").includes(q) ||
            p.id.toLowerCase().includes(q)
        )
      : list;

    return filtered.map((p) => {
      const history = this.getPatientHistoryTimeline(p.id);
      const eventCount = (history?.timeline ?? []).length;
      return {
        ...p,
        UHID: p.uhid,
        status: (p as any).status || "DISCHARGED",
        eventCount
      };
    });
  }

  // --- Appointments & Queue Selectors ---
  public getAppointments(): Appointment[] {
    return (this.data.appointments || []).map((apt: any) => {
      const patient = this.getPatientById(apt.patientId);
      return {
        ...apt,
        patientName: patient ? patient.name : apt.patientName
      };
    });
  }

  public getQueueEntries(): QueueEntry[] {
    return (this.data.queueEntries || []).map((q: any) => {
      const patient = this.getPatientById(q.patientId);
      return {
        ...q,
        patientName: patient ? patient.name : q.patientName
      };
    });
  }

  public updateQueueEntryStatus(id: string, status: string) {
    const entry = (this.data.queueEntries || []).find(
      (q: any) => q.id === id || q.patientId === id
    );
    if (entry) {
      entry.status = status;
    }
  }

  // --- Doctor Station & Consultation Selectors ---
  public getConsultations(): Consultation[] {
    return (this.data.consultations || []).map((c: any) => ({
      ...c,
      icd10: c.icd10Code || c.icd10 || "R50.9"
    }));
  }

  public getConsultationByPatientId(patientId: string): Consultation | undefined {
    return this.getConsultations().find((c) => c.patientId === patientId);
  }

  public getVitals(): Vital[] {
    return (this.data.vitals || []).map((v: any) => ({
      ...v,
      bloodPressure: `${v.bpSystolic || 120}/${v.bpDiastolic || 80}`,
      temperature: v.temperatureF || v.temperature || 98.6,
      spO2: v.spo2 || v.spO2 || 98,
      weight: v.weightKg || v.weight || 65,
      heartRate: 75
    }));
  }

  public getVitalsByPatientId(patientId: string): Vital[] {
    return this.getVitals().filter((v) => v.patientId === patientId);
  }

  public getLatestVitalsByPatientId(patientId: string): Vital | undefined {
    const list = this.getVitalsByPatientId(patientId);
    return list.length > 0 ? list[list.length - 1] : undefined;
  }

  // --- Prescriptions Selectors ---
  public getPrescriptions() {
    return (this.data.prescriptions || []).map((rx: any) => {
      const patient = this.getPatientById(rx.patientId);
      const doctor = this.getUserById(rx.doctorId);
      const items = (this.data.prescriptionItems || [])
        .filter((i: any) => i.prescriptionId === rx.id)
        .map((i: any) => {
          const med = (this.data.medicines || []).find((m: any) => m.id === i.medicineId);
          const prescribedQty = i.prescribedQuantity || i.quantity || 10;
          const dispensedQty = i.dispensedQuantity || 0;
          return {
            ...i,
            medicineName: med ? med.name : (i.medicineName || "Medication"),
            dosage: i.dosage || "650mg",
            frequency: i.frequency || "1-0-1",
            durationDays: i.durationDays || 5,
            prescribedQuantity: prescribedQty,
            dispensedQuantity: dispensedQty,
            remainingQuantity: Math.max(0, prescribedQty - dispensedQty),
            unitPrice: med ? med.unitPrice : 15,
            totalPrice: (med ? med.unitPrice : 15) * prescribedQty,
            rackLocation: med ? (med.rack || (med as any).rackLocation) : "A-01",
            stockQuantity: med ? (med.stock ?? (med as any).stockQuantity) : 100,
            minimumStock: med ? med.minimumStock : 10,
            medicineStatus: med ? med.status : "ACTIVE",
            expiryDate: med ? med.expiryDate : "2027-12-31",
            isExpired: false,
            isInactive: false
          };
        });

      return {
        ...rx,
        patientId: rx.patientId,
        patientName: patient ? patient.name : "Unknown",
        patientUHID: patient ? patient.uhid : (rx.patientUHID || "MED-20001"),
        patientAge: patient ? patient.age : 42,
        patientGender: patient ? patient.gender : "MALE",
        doctorName: doctor ? doctor.name : (rx.doctorName || "Dr. Rohan Sharma"),
        status: rx.status || "PENDING_DISPENSE",
        prescribedAt: rx.prescribedAt || rx.createdAt || new Date().toISOString(),
        items
      };
    });
  }

  public getPrescriptionDetailsById(prescriptionId: string) {
    const all = this.getPrescriptions();
    const matched = all.find((p: any) => p.id === prescriptionId) || all[0];
    if (!matched) return null;
    const patient = this.getPatientById(matched.patientId);
    return {
      id: matched.id,
      patient: {
        id: matched.patientId,
        name: matched.patientName,
        UHID: matched.patientUHID || patient?.uhid || "MED-20001",
        age: matched.patientAge || patient?.age,
        gender: matched.patientGender || patient?.gender,
        allergies: patient?.allergies ? patient.allergies.map((a: string) => ({ allergy: a, severity: "HIGH" })) : []
      },
      doctor: {
        name: matched.doctorName || "Dr. Rohan Sharma"
      },
      status: matched.status || "PENDING_DISPENSE",
      prescribedAt: matched.prescribedAt || matched.createdAt || new Date().toISOString(),
      items: matched.items || []
    };
  }

  public getPrescriptionsByPatientId(patientId: string) {
    return this.getPrescriptions().filter((rx: any) => rx.patientId === patientId);
  }

  // --- Laboratory Selectors ---
  public getLabTests() {
    return this.data.labTests || [];
  }

  public getLabOrders() {
    if (!this.data.labOrders || !Array.isArray(this.data.labOrders) || this.data.labOrders.length === 0) {
      const now = new Date();

      const mockOrders: any[] = [];
      let counter = 1000;

      // Deliberately distinct sample distribution across last 6 hours to create a clear Rise/Fall curve:
      // H-5 -> 2, H-4 -> 8 (Rise), H-3 -> 3 (Fall), H-2 -> 7 (Rise), H-1 -> 1 (Fall), H-0 -> 5 (Rise)
      const schedule = [
        { hoursAgo: 5, count: 2 },
        { hoursAgo: 4, count: 8 },
        { hoursAgo: 3, count: 3 },
        { hoursAgo: 2, count: 7 },
        { hoursAgo: 1, count: 1 },
        { hoursAgo: 0, count: 5 }
      ];

      schedule.forEach(({ hoursAgo, count }) => {
        for (let i = 0; i < count; i++) {
          counter++;
          const orderDate = new Date(now.getTime() - hoursAgo * 3600 * 1000);
          orderDate.setMinutes(Math.min(i * 10 + 5, 55));
          const ts = orderDate.toISOString();

          mockOrders.push({
            id: `LAB-${counter}`,
            patientId: i % 2 === 0 ? "PAT-001" : "PAT-002",
            doctorId: "USR-DOC-001",
            priority: i % 5 === 0 ? "STAT" : "ROUTINE",
            status: i % 3 === 0 ? "COLLECTED" : i % 3 === 1 ? "PROCESSING" : "COMPLETED",
            createdAt: ts,
            collectedAt: ts,
            testIds: ["TEST-CBC", "TEST-LFT"]
          });
        }
      });

      this.data.labOrders = mockOrders;
    }

    return (this.data.labOrders || []).map((order: any) => {
      const patient = this.getPatientById(order.patientId);
      const doctor = this.getUserById(order.doctorId);
      const items = (this.data.labOrderItems || [])
        .filter((item: any) => item.labOrderId === order.id)
        .map((item: any) => {
          const test = this.getLabTests().find((t: any) => t.id === item.testId);
          return { ...item, testName: test ? test.name : item.testId };
        });
      const results = (this.data.labResults || []).filter((r: any) => r.labOrderId === order.id);
      return {
        ...order,
        patientName: patient ? patient.name : "Unknown",
        doctorName: doctor ? doctor.name : "Unknown",
        items,
        results
      };
    });
  }

  public addLabOrder(newOrder: any) {
    const orders = this.getLabOrders();
    this.data.labOrders = [newOrder, ...orders];
  }

  public collectLabOrder(orderIdOrBarcode: string): { success: boolean; message?: string; order?: any } {
    const orders = this.getLabOrders();
    const cleanId = (orderIdOrBarcode || "").trim().toLowerCase();
    if (!cleanId) {
      return { success: false, message: "Please enter an Order ID or Barcode" };
    }

    const order = orders.find(
      (o: any) =>
        (o.id || "").toLowerCase() === cleanId ||
        (o.sampleId || "").toLowerCase() === cleanId ||
        (o.accessionId || "").toLowerCase() === cleanId ||
        (o.patientUHID || "").toLowerCase() === cleanId
    );

    if (!order) {
      return { success: false, message: "Order not found" };
    }

    const currentStatus = (order.status || "").toUpperCase();
    if (
      currentStatus === "COLLECTED" ||
      currentStatus === "PROCESSING" ||
      currentStatus === "COMPLETED" ||
      currentStatus === "RELEASED"
    ) {
      return { success: false, message: "Order already collected", order };
    }

    const nowIso = new Date().toISOString();
    order.status = "COLLECTED";
    order.collectedAt = nowIso;
    if (!order.sampleId) {
      order.sampleId = `SMP-${Date.now().toString().slice(-6)}`;
    }

    return { success: true, order };
  }

  public addLabResults(orderId: string, resultsPayload: any): { success: boolean; order?: any } {
    const orders = this.getLabOrders();
    const order = orders.find((o: any) => (o.id || "").toLowerCase() === (orderId || "").toLowerCase());
    if (!order) return { success: false };

    order.status = "RESULTS_READY";
    if (!order.results) order.results = [];

    const newResults = (resultsPayload.results || []).map((r: any, idx: number) => ({
      id: `RES-${Date.now()}-${idx}`,
      labOrderId: order.id,
      testId: r.testId,
      status: "ENTERED",
      parameters: r.parameters || [],
      isCritical: r.isCritical || false
    }));

    order.results = [...order.results, ...newResults];
    return { success: true, order };
  }

  public getLabResultsByPatientId(patientId: string) {
    const orders = this.getLabOrders().filter((o: any) => o.patientId === patientId);
    const orderIds = new Set(orders.map((o: any) => o.id));
    return (this.data.labResults || []).filter((r: any) => orderIds.has(r.labOrderId));
  }

  public getCriticalLabResults() {
    return [
      {
        id: "CRIT-001",
        patientName: "Patient 75",
        patientUHID: "MED-20075",
        tests: "CRP, URINE-R, CRP",
        criticalValue: "20.6 units",
        timestamp: "2:33:43 PM"
      },
      {
        id: "CRIT-002",
        patientName: "Patient 146",
        patientUHID: "MED-20146",
        tests: "LIPID, KFT, LIPID",
        criticalValue: "N/A",
        timestamp: "11:53:41 AM"
      },
      {
        id: "CRIT-003",
        patientName: "Patient 43",
        patientUHID: "MED-20043",
        tests: "KFT, CBC",
        criticalValue: "N/A",
        timestamp: "10:58:14 AM"
      },
      {
        id: "CRIT-004",
        patientName: "Patient 79",
        patientUHID: "MED-20079",
        tests: "LIPID",
        criticalValue: "N/A",
        timestamp: "9:52:40 AM"
      },
      {
        id: "CRIT-005",
        patientName: "Patient 95",
        patientUHID: "MED-20095",
        tests: "DENGUE, DENGUE",
        criticalValue: "67.5 units",
        timestamp: "8:28:30 AM"
      },
      {
        id: "CRIT-006",
        patientName: "Patient 88",
        patientUHID: "MED-20088",
        tests: "CBC, CRP",
        criticalValue: "49.7 units",
        timestamp: "8:26:18 AM"
      },
      {
        id: "CRIT-007",
        patientName: "Patient 87",
        patientUHID: "MED-20087",
        tests: "URINE-R, DENGUE, HBA1C",
        criticalValue: "85.4 units",
        timestamp: "4:42:57 AM"
      }
    ];
  }

  public calculateSamplesReceivedLast6Hours(): { time: string; value: number }[] {
    const orders = this.getLabOrders();
    const now = new Date();

    const buckets: { time: string; hour: number; value: number }[] = [];

    // Build 6 consecutive 1-hour time buckets ending at current hour
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600 * 1000);
      const h = d.getHours();
      const label = `${String(h).padStart(2, "0")}:00`;
      buckets.push({
        time: label,
        hour: h,
        value: 0
      });
    }

    orders.forEach((o: any) => {
      const tsStr = o.collectedAt || o.receivedAt || o.createdAt || o.orderedAt || o.timestamp;
      if (!tsStr) return;

      let dateObj: Date | null = null;
      if (typeof tsStr === "number") {
        dateObj = new Date(tsStr);
      } else if (typeof tsStr === "string") {
        const parsed = Date.parse(tsStr);
        if (!isNaN(parsed)) {
          dateObj = new Date(parsed);
        }
      }

      if (dateObj) {
        const orderHour = dateObj.getHours();
        const matched = buckets.find((b) => b.hour === orderHour);
        if (matched) {
          matched.value += 1;
        }
      }
    });

    return buckets.map((b) => ({ time: b.time, value: b.value }));
  }

  public getLaboratoryDashboardData() {
    const orders = this.getLabOrders();
    const tests = this.getLabTests();
    const samplesReceivedChart = this.calculateSamplesReceivedLast6Hours();

    return {
      metrics: {
        toCollect: orders.filter((o: any) => o.status === "ORDERED" || o.status === "TO_COLLECT").length || 47,
        processing: orders.filter((o: any) => o.status === "COLLECTED" || o.status === "PROCESSING").length || 78,
        completedToday: orders.filter((o: any) => o.status === "COMPLETED" || o.status === "RELEASED" || o.status === "REVIEWED").length || 29,
        criticalValues: 7,
        statPending: orders.filter((o: any) => o.priority === "STAT" && o.status !== "COMPLETED").length || 21
      },
      samplesReceivedChart,
      departmentLoad: [
        { name: "Hematology", count: 18, percentage: 40 },
        { name: "Biochem", count: 31, percentage: 75 },
        { name: "Microbio", count: 9, percentage: 25 },
        { name: "Serology", count: 7, percentage: 20 }
      ],
      criticalResults: this.getCriticalLabResults(),
      orders,
      tests
    };
  }

  // --- IPD & Wards Selectors ---
  public getBeds(): Bed[] {
    if (!this.data.beds || !Array.isArray(this.data.beds) || this.data.beds.length === 0) {
      this.data.beds = [
        { id: "BED-101", bedNumber: "G-101", ward: "General Ward Male", wardCode: "GWM", status: "AVAILABLE", dailyRate: 500, equipment: ["Oxygen Outlet"], patientId: null },
        { id: "BED-102", bedNumber: "G-102", ward: "General Ward Male", wardCode: "GWM", status: "OCCUPIED", dailyRate: 500, equipment: ["Oxygen Outlet", "IV Stand"], patientId: "PAT-001" },
        { id: "BED-103", bedNumber: "G-103", ward: "General Ward Male", wardCode: "GWM", status: "CLEANING", dailyRate: 500, equipment: ["Oxygen Outlet"], patientId: null },
        { id: "BED-104", bedNumber: "G-104", ward: "General Ward Male", wardCode: "GWM", status: "AVAILABLE", dailyRate: 500, equipment: ["Oxygen Outlet"], patientId: null },
        { id: "BED-201", bedNumber: "G-201", ward: "General Ward Female", wardCode: "GWF", status: "AVAILABLE", dailyRate: 500, equipment: ["Oxygen Outlet"], patientId: null },
        { id: "BED-202", bedNumber: "G-202", ward: "General Ward Female", wardCode: "GWF", status: "OCCUPIED", dailyRate: 500, equipment: ["Oxygen Outlet"], patientId: "PAT-002" },
        { id: "BED-301", bedNumber: "P-301", ward: "Private Ward", wardCode: "PVT", status: "AVAILABLE", dailyRate: 1500, equipment: ["Oxygen Outlet", "Monitor", "AC"], patientId: null },
        { id: "BED-401", bedNumber: "ICU-1", ward: "ICU", wardCode: "ICU", status: "OCCUPIED", dailyRate: 3500, equipment: ["Ventilator", "Multi-para Monitor", "Infusion Pump"], patientId: "PAT-003" }
      ];
    }
    return (this.data.beds || []) as Bed[];
  }

  public getAdmissions(): Admission[] {
    return (this.data.admissions || []) as Admission[];
  }

  public getNurses(): Nurse[] {
    return (this.data.nurses || []) as Nurse[];
  }

  public getWardRounds(): WardRound[] {
    return (this.data.wardRounds || []) as WardRound[];
  }

  public getIPDIndents() {
    if (!this.data.ipdIndents || (this.data.ipdIndents as any[]).length === 0) {
      (this.data as any).ipdIndents = [
        {
          id: "IND-001",
          patientId: "PAT-002",
          bedId: "BED-G102",
          ward: "General Male",
          bedNumber: "G-102",
          status: "PENDING",
          priority: "ROUTINE",
          createdAt: new Date().toISOString()
        },
        {
          id: "IND-002",
          patientId: "PAT-003",
          bedId: "BED-P301",
          ward: "Private Ward",
          bedNumber: "P-301",
          status: "PENDING",
          priority: "STAT",
          createdAt: new Date().toISOString()
        },
        {
          id: "IND-003",
          patientId: "PAT-001",
          bedId: "BED-G201",
          ward: "General Female",
          bedNumber: "G-201",
          status: "PENDING",
          priority: "ROUTINE",
          createdAt: new Date().toISOString()
        }
      ];

      (this.data as any).ipdIndentItems = [
        { id: "ITEM-001", indentId: "IND-001", medicineId: "MED-001", medicineName: "Pan 40", quantity: 3, dosage: "1-0-0", location: "Loc: R1-S4" },
        { id: "ITEM-002", indentId: "IND-001", medicineId: "MED-002", medicineName: "Monocef 1g", quantity: 2, dosage: "1-0-1", location: "Loc: R2-S3" },
        { id: "ITEM-003", indentId: "IND-002", medicineId: "MED-003", medicineName: "Dolo 650", quantity: 5, dosage: "1-1-1", location: "Loc: R1-S2" },
        { id: "ITEM-004", indentId: "IND-002", medicineId: "MED-004", medicineName: "Azithromycin 500mg", quantity: 1, dosage: "1-0-0", location: "Loc: R3-S1" },
        { id: "ITEM-005", indentId: "IND-003", medicineId: "MED-005", medicineName: "Pantocid 40", quantity: 2, dosage: "1-0-0", location: "Loc: R1-S5" }
      ];

      this.applyPersistedIndentFulfillment();
    }

    return (this.data.ipdIndents || [])
      .filter((indent: any) => indent.status !== "FULFILLED")
      .map((indent: any) => {
        const patient = this.getPatientById(indent.patientId);
        const bed = this.getBeds().find((b) => b.id === indent.bedId);
        const items = ((this.data as any).ipdIndentItems || [])
          .filter((item: any) => item.indentId === indent.id)
          .map((item: any) => {
            const med = (this.data.medicines || []).find((m: any) => m.id === item.medicineId);
            return {
              ...item,
              medicineName: med ? med.name : item.medicineName || item.medicineId,
              dosage: item.dosage || "1-0-0",
              location: item.location || "Loc: Main Stock"
            };
          });
        return {
          ...indent,
          patientName: patient ? patient.name : indent.patientName || "Rahul Verma",
          patientUHID: patient ? patient.uhid : indent.patientUHID || "ABHA-1234",
          bedNumber: bed ? bed.bedNumber : indent.bedNumber || "G-102",
          ward: indent.ward || (bed ? (bed as any).type || (bed as any).ward || "General Ward" : "General Ward"),
          items
        };
      });
  }

  private getPersistedIndentFulfillments(): Record<string, FulfilledIndentRecord> {
    if (!canUseLocalStorage()) {
      return {};
    }

    try {
      const raw = window.localStorage.getItem(FULFILLED_INDENTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private savePersistedIndentFulfillment(indentId: string, record: FulfilledIndentRecord) {
    if (!canUseLocalStorage()) {
      return;
    }

    const persisted = this.getPersistedIndentFulfillments();
    persisted[indentId] = record;
    window.localStorage.setItem(FULFILLED_INDENTS_STORAGE_KEY, JSON.stringify(persisted));
  }

  private applyPersistedIndentFulfillment() {
    const persisted = this.getPersistedIndentFulfillments();
    const entries = Object.entries(persisted);
    if (entries.length === 0) {
      return;
    }

    const rawIndents = (this.data as any).ipdIndents || [];
    const medicines = this.getMedicines();

    entries.forEach(([indentId, record]) => {
      const target = rawIndents.find((i: any) => i.id === indentId);
      if (!target || target.status === "FULFILLED") {
        return;
      }

      const rawItems = ((this.data as any).ipdIndentItems || []).filter((item: any) => item.indentId === target.id);
      rawItems.forEach((item: any) => {
        const med = medicines.find(
          (m: any) => m.id === item.medicineId || (m.name || "").toLowerCase() === (item.medicineName || "").toLowerCase()
        );
        if (med) {
          const curStock = med.stock ?? (med as any).stockQuantity ?? 0;
          med.stock = Math.max(0, curStock - (item.quantity || 1));
          if ((med as any).stockQuantity !== undefined) {
            (med as any).stockQuantity = med.stock;
          }
        }
      });

      target.status = record.status;
      target.fulfilledAt = record.fulfilledAt;
    });
  }

  public fulfillIPDIndent(indentId: string): { success: boolean; message?: string } {
    const rawIndents = (this.data as any).ipdIndents || [];
    const target = rawIndents.find((i: any) => i.id === indentId);
    if (!target) {
      return { success: false, message: "Indent not found" };
    }

    if (target.status === "FULFILLED") {
      return { success: false, message: "Indent is already fulfilled" };
    }

    const rawItems = ((this.data as any).ipdIndentItems || []).filter((item: any) => item.indentId === target.id);
    const medicines = this.getMedicines();

    // Verify stock availability for all requested items
    for (const item of rawItems) {
      const med = medicines.find(
        (m: any) => m.id === item.medicineId || (m.name || "").toLowerCase() === (item.medicineName || "").toLowerCase()
      );
      const availableStock = med ? (med.stock ?? (med as any).stockQuantity ?? 0) : 100;
      if (availableStock < (item.quantity || 1)) {
        return {
          success: false,
          message: `Insufficient stock for ${item.medicineName || "medicine"}. Required: ${item.quantity || 1}, Available: ${availableStock}`
        };
      }
    }

    // Deduct stock for all items
    for (const item of rawItems) {
      const med = medicines.find(
        (m: any) => m.id === item.medicineId || (m.name || "").toLowerCase() === (item.medicineName || "").toLowerCase()
      );
      if (med) {
        const curStock = med.stock ?? (med as any).stockQuantity ?? 0;
        med.stock = Math.max(0, curStock - (item.quantity || 1));
        if ((med as any).stockQuantity !== undefined) {
          (med as any).stockQuantity = med.stock;
        }
      }
    }

    target.status = "FULFILLED";
    target.fulfilledAt = new Date().toISOString();
    this.savePersistedIndentFulfillment(indentId, {
      status: "FULFILLED",
      fulfilledAt: target.fulfilledAt
    });

    return { success: true, message: `Indent ${target.id} fulfilled successfully.` };
  }

  public updateMedicine(medicineId: string, updatedData: any): { success: boolean; message?: string; medicine?: any } {
    const medicines = this.getMedicines();
    const target = medicines.find((m: any) => m.id === medicineId);
    if (!target) return { success: false, message: "Medicine not found" };

    if (updatedData.name !== undefined) target.name = updatedData.name;
    if (updatedData.genericName !== undefined) target.genericName = updatedData.genericName;
    if (updatedData.category !== undefined) target.category = updatedData.category;
    if (updatedData.rackLocation !== undefined || updatedData.rack !== undefined) {
      const r = updatedData.rackLocation || updatedData.rack;
      (target as any).rackLocation = r;
      (target as any).rack = r;
    }
    if (updatedData.stockQuantity !== undefined || updatedData.stock !== undefined) {
      const s = Number(updatedData.stockQuantity ?? updatedData.stock ?? 0);
      target.stock = s;
      (target as any).stockQuantity = s;
    }
    if (updatedData.minimumStock !== undefined) target.minimumStock = Number(updatedData.minimumStock);
    if (updatedData.unitPrice !== undefined) target.unitPrice = Number(updatedData.unitPrice);
    if (updatedData.expiryDate !== undefined) target.expiryDate = updatedData.expiryDate;

    return { success: true, message: "Medicine updated successfully", medicine: target };
  }

  public addMedicine(newMedData: any): { success: boolean; message?: string; medicine?: any } {
    const medicines = this.getMedicines();
    const newId = `MED-${Date.now().toString().slice(-6)}`;
    const s = Number(newMedData.stockQuantity ?? newMedData.stock ?? 100);
    const r = newMedData.rackLocation || newMedData.rack || "R1-S1";
    const newMed = {
      id: newId,
      name: newMedData.name || "New Medicine",
      genericName: newMedData.genericName || "",
      category: newMedData.category || "General",
      rackLocation: r,
      rack: r,
      stock: s,
      stockQuantity: s,
      minimumStock: Number(newMedData.minimumStock || 50),
      unitPrice: Number(newMedData.unitPrice || 10),
      unit: newMedData.unit || "Tablets",
      expiryDate: newMedData.expiryDate || "2026-12-31"
    };

    (this.data as any).medicines = [newMed, ...medicines];
    return { success: true, message: "Medicine added successfully", medicine: newMed };
  }

  public getIPDDashboardData() {
    const beds = this.getBeds().map((b) => {
      const patient = b.patientId ? this.getPatientById(b.patientId) : null;
      const activeAdmission = b.patientId
        ? this.getAdmissions().find((a) => a.patientId === b.patientId && a.status === "ACTIVE")
        : null;
      const doctor = activeAdmission ? this.getUserById(activeAdmission.doctorId) : null;

      return {
        ...b,
        patient: patient
          ? {
              id: patient.id,
              name: patient.name,
              UHID: patient.uhid,
              age: patient.age,
              gender: patient.gender,
              mobile: patient.mobile
            }
          : null,
        activeAdmission: activeAdmission
          ? {
              id: activeAdmission.id,
              doctorName: doctor ? doctor.name : "Dr. Rohan Sharma",
              admittedAt: activeAdmission.admittedAt,
              reason: activeAdmission.reason
            }
          : null
      };
    });

    const admissions = this.getAdmissions().map((a) => {
      const patient = this.getPatientById(a.patientId);
      const bed = this.getBeds().find((b) => b.id === a.bedId);
      const doctor = this.getUserById(a.doctorId);
      return {
        id: a.id,
        patientId: a.patientId,
        patientName: patient ? patient.name : "Unknown",
        patientUHID: patient ? patient.uhid : "",
        patientAge: patient ? patient.age : 0,
        patientGender: patient ? patient.gender : "",
        bedNumber: bed ? bed.bedNumber : "",
        ward: bed ? bed.ward : "",
        doctorName: doctor ? doctor.name : "",
        admittedAt: a.admittedAt,
        reason: a.reason,
        status: a.status
      };
    });

    const totalBeds = beds.length;
    const occupiedBeds = beds.filter((b) => b.status === "OCCUPIED").length;
    const availableBeds = beds.filter((b) => b.status === "AVAILABLE").length;
    const maintenanceBeds = beds.filter((b) => b.status === "MAINTENANCE" || b.status === "CLEANING").length;

    return {
      metrics: {
        totalBeds,
        occupiedBeds,
        availableBeds,
        maintenanceBeds,
        activeAdmissionsCount: admissions.length,
        occupancyPercentage: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        avgStayDays: 0,
        dailyEstRev: 0
      },
      beds,
      admissions,
      nurses: this.getNurses(),
      wardRounds: this.getWardRounds(),
      ipdIndents: this.getIPDIndents()
    };
  }

  // --- Pharmacy Selectors ---
  public getMedicines() {
    return this.data.medicines || [];
  }

  public getReturnsAndWaste() {
    if (!this.data.returnsAndWaste || (this.data.returnsAndWaste as any[]).length === 0) {
      (this.data as any).returnsAndWaste = [
        {
          id: "RET-001",
          source: "ICU - Bed 1",
          medicineId: "MED-002",
          medicineName: "Monocef 1g",
          quantity: 2,
          reason: "Treatment Changed",
          type: "RETURN",
          status: "PENDING",
          createdAt: new Date().toISOString()
        },
        {
          id: "RET-002",
          source: "Private Ward - Bed P-301",
          medicineId: "MED-001",
          medicineName: "Pan 40",
          quantity: 3,
          reason: "Patient Discharged",
          type: "RETURN",
          status: "PENDING",
          createdAt: new Date().toISOString()
        },
        {
          id: "RET-003",
          source: "General Ward - Bed G-102",
          medicineId: "MED-003",
          medicineName: "Damaged Syringe",
          quantity: 1,
          reason: "Damaged",
          type: "WASTE",
          status: "PENDING",
          createdAt: new Date().toISOString()
        }
      ];
    }

    const medicines = this.getMedicines();
    return (this.data.returnsAndWaste || []).map((r: any) => {
      const patient = r.patientId ? this.getPatientById(r.patientId) : null;
      const med = medicines.find((m: any) => m.id === r.medicineId);
      return {
        ...r,
        patientName: patient ? patient.name : r.patientName || "Patient",
        medicineName: med ? med.name : r.medicineName || "Medication"
      };
    });
  }

  private getPersistedReturnProcessing(): Record<string, ProcessedReturnRecord> {
    if (!canUseLocalStorage()) {
      return {};
    }

    try {
      const raw = window.localStorage.getItem(PROCESSED_RETURNS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private savePersistedReturnProcessing(returnId: string, record: ProcessedReturnRecord) {
    if (!canUseLocalStorage()) {
      return;
    }

    const persisted = this.getPersistedReturnProcessing();
    persisted[returnId] = record;
    window.localStorage.setItem(PROCESSED_RETURNS_STORAGE_KEY, JSON.stringify(persisted));
  }

  private applyPersistedReturnProcessing() {
    const persisted = this.getPersistedReturnProcessing();
    const entries = Object.entries(persisted);
    if (entries.length === 0) {
      return;
    }

    const rawReturns = (this.data as any).returnsAndWaste || [];
    const medicines = this.getMedicines();

    entries.forEach(([returnId, record]) => {
      const target = rawReturns.find((r: any) => r.id === returnId);
      if (!target) {
        return;
      }

      target.status = record.status;
      target.processedAt = record.processedAt;

      if (record.action === "restock") {
        const med = medicines.find(
          (m: any) => m.id === target.medicineId || (m.name || "").toLowerCase() === (target.medicineName || "").toLowerCase()
        );
        if (med) {
          const curStock = med.stock ?? (med as any).stockQuantity ?? 0;
          med.stock = curStock + (target.quantity || 1);
          if ((med as any).stockQuantity !== undefined) {
            (med as any).stockQuantity = med.stock;
          }
        }
      }
    });
  }

  public processReturnRequest(returnId: string, action: "restock" | "dispose" | "reject"): { success: boolean; message?: string } {
    const rawReturns = (this.data as any).returnsAndWaste || [];
    const target = rawReturns.find((r: any) => r.id === returnId);
    if (!target) {
      return { success: false, message: "Return request not found" };
    }

    const currentStatus = (target.status || "").toUpperCase();
    if (currentStatus !== "PENDING" && currentStatus !== "PENDING_VERIFICATION") {
      return { success: false, message: "Return request has already been processed" };
    }

    if (action === "restock") {
      if (target.type === "WASTE") {
        return { success: false, message: "Waste items cannot be restocked into inventory." };
      }
      const medicines = this.getMedicines();
      const med = medicines.find(
        (m: any) => m.id === target.medicineId || (m.name || "").toLowerCase() === (target.medicineName || "").toLowerCase()
      );
      if (med) {
        const curStock = med.stock ?? (med as any).stockQuantity ?? 0;
        med.stock = curStock + (target.quantity || 1);
        if ((med as any).stockQuantity !== undefined) {
          (med as any).stockQuantity = med.stock;
        }
      }
      target.status = "VERIFIED_RESTOCKED";
      target.processedAt = new Date().toISOString();
      this.savePersistedReturnProcessing(returnId, {
        status: target.status,
        action,
        processedAt: target.processedAt
      });
      return { success: true, message: `${target.medicineName || "Item"} (Qty: ${target.quantity || 1}) restocked successfully.` };
    }

    if (action === "dispose") {
      target.status = "VERIFIED_DISPOSED";
      target.processedAt = new Date().toISOString();
      this.savePersistedReturnProcessing(returnId, {
        status: target.status,
        action,
        processedAt: target.processedAt
      });
      return { success: true, message: `${target.medicineName || "Item"} verified & disposed.` };
    }

    if (action === "reject") {
      target.status = "REJECTED";
      target.processedAt = new Date().toISOString();
      this.savePersistedReturnProcessing(returnId, {
        status: target.status,
        action,
        processedAt: target.processedAt
      });
      return { success: true, message: `Return request ${target.id} rejected.` };
    }

    return { success: false, message: "Invalid action" };
  }

  public getPharmacyData() {
    const prescriptions = this.getPrescriptions();
    const medicines = this.getMedicines();
    const ipdIndents = this.getIPDIndents();
    const returns = this.getReturnsAndWaste();

    const dailyOpdScripts = prescriptions.length;
    const wardIndentsCount = ipdIndents.length;
    const stockAlerts = medicines.filter((m: any) => (m.stock ?? (m as any).stockQuantity ?? 0) < 50).length;
    const pendingReturns = returns.filter((r: any) => (r.status || "").toUpperCase() === "PENDING").length;

    const totalRequisitions = prescriptions.length;
    const pendingDispense = prescriptions.filter(
      (p: any) => p.status === "PENDING" || p.status === "PENDING_DISPENSE" || p.status === "SENT_TO_PHARMACY"
    ).length;
    const dispensedToday = prescriptions.filter((p: any) => p.status === "DISPENSED").length;

    return {
      metrics: {
        dailyOpdScripts,
        wardIndentsCount,
        stockAlerts,
        pendingReturns,
        totalRequisitions,
        pendingDispense,
        dispensedToday,
        lowStockAlerts: stockAlerts
      },
      prescriptions,
      medicines,
      ipdIndents,
      pharmacyOrders: (this.data.pharmacyOrders || []).map((po: any) => {
        const patient = this.getPatientById(po.patientId);
        return {
          ...po,
          patientName: patient ? patient.name : "Unknown"
        };
      }),
      transactions: this.data.pharmacyTransactions || [],
      returns
    };
  }

  // --- Dashboard Analytics ---
  public getDashboardAnalytics() {
    const dash = this.data.dashboard || {};
    return {
      greeting: `Good Morning, ${dash.physicianName || "Dr. Rohan Sharma"}`,
      stats: {
        myQueue: {
          count: dash.myQueue || 12,
          highPriority: dash.highPriority || 4
        },
        pendingReports: {
          count: dash.pendingReports || 5,
          ready: 3
        },
        ipdRounds: {
          count: dash.ipdRounds || 3,
          pending: 3
        }
      },
      upcomingAppointments: (dash.upcomingAppointments || []).map((apt: any) => ({
        patientId: apt.patientId,
        patientName: apt.patientName,
        type: apt.type,
        time: apt.time
      })),
      doctor: this.getUserById("USR-DOC-001") || { name: "Dr. Rohan Sharma" }
    };
  }

  // --- Patient History Timeline ---
  public getPatientHistoryTimeline(patientId: string) {
    const patient = this.getPatientById(patientId);
    if (!patient) return null;

    const consultations = this.getConsultations().filter((c) => c.patientId === patientId);
    const vitals = this.getVitalsByPatientId(patientId);
    const labOrders = this.getLabOrders().filter((l: any) => l.patientId === patientId);
    const prescriptions = this.getPrescriptionsByPatientId(patientId);
    const admissions = this.getAdmissions().filter((a) => a.patientId === patientId);

    const events: any[] = [];

    // Add Consultations
    consultations.forEach((c: any) => {
      events.push({
        id: `EVT-CON-${c.id}`,
        type: "consultation",
        title: "Consultation",
        actor: "Dr. Sharma",
        timestamp: c.createdAt || "2026-08-26T15:45:00Z",
        description: c.assessment || `Consultation recorded. Assessment: ${c.subjective || "General OPD checkup"}. ICD-10: ${c.icd10 || "R50.9"}.`
      });
    });

    // Add Lab Orders
    labOrders.forEach((l: any) => {
      const tests = Array.isArray(l.items)
        ? l.items.map((i: any) => i.testName || i.test?.name || "Lab Test").join(", ")
        : "Lab Test";
      events.push({
        id: `EVT-LAB-${l.id}`,
        type: "lab_order",
        title: "Lab Order",
        actor: "Dr. Sharma",
        timestamp: l.createdAt || "2026-08-26T18:29:00Z",
        description: `Ordered: ${tests}`
      });
    });

    // Add Prescriptions
    prescriptions.forEach((p: any) => {
      const meds = Array.isArray(p.items)
        ? p.items.map((i: any) => i.medicineName || i.medicine?.name || "Medication").join(", ")
        : "Medication";
      events.push({
        id: `EVT-RX-${p.id}`,
        type: "procedure",
        title: "Prescription Issued",
        actor: "Dr. Sharma",
        timestamp: p.createdAt || "2026-08-26T17:00:00Z",
        description: `Prescribed: ${meds}`
      });
    });

    // Add Vitals
    vitals.forEach((v: any) => {
      events.push({
        id: `EVT-VIT-${v.id}`,
        type: "vitals_check",
        title: "Vitals Check",
        actor: "Nurse Anjali",
        timestamp: v.recordedAt || v.createdAt || "2026-08-26T15:15:00Z",
        description: `Recorded Vitals: BP ${v.bpSystolic || v.systolicBP || 120}/${v.bpDiastolic || v.diastolicBP || 80} mmHg, SpO2 ${v.spo2 || v.spO2 || 98}%, Temp ${v.temperatureF || v.temperature || 98.6}°F, Weight ${v.weightKg || v.weight || 65} kg.`
      });
    });

    // Add Admissions & Discharges
    admissions.forEach((a: any) => {
      events.push({
        id: `EVT-ADM-${a.id}`,
        type: "admission",
        title: "Admission",
        actor: "Dr. Sharma",
        timestamp: a.admittedAt || "2026-08-25T16:30:00Z",
        description: `Admitted to General Ward, Bed ${a.bedNumber || (a as any).bedId || "G-102"}. Reason: ${a.reason || "Observation & IV fluids"}.`
      });
      if (a.status === "DISCHARGED") {
        events.push({
          id: `EVT-DIS-${a.id}`,
          type: "discharge",
          title: "Discharge",
          actor: "Dr. Sharma",
          timestamp: a.dischargedAt || "2026-08-26T20:00:00Z",
          description: "Patient discharged. Vitals stable. Prescribed home meds."
        });
      }
    });

    // Patient specific default timelines
    const defaultTimelines: Record<string, any[]> = {
      "PAT-001": [
        { id: "PAT1-E1", type: "lab_order", title: "Lab Order", actor: "Dr. Sharma", timestamp: "2026-08-26T18:29:00Z", description: "Ordered: KFT" },
        { id: "PAT1-E2", type: "lab_order", title: "Lab Order", actor: "Dr. Sharma", timestamp: "2026-08-26T18:28:00Z", description: "Ordered: TSH" },
        { id: "PAT1-E3", type: "lab_order", title: "Lab Order", actor: "Dr. Sharma", timestamp: "2026-08-26T18:26:00Z", description: "Ordered: CBC" },
        { id: "PAT1-E4", type: "discharge", title: "Discharge", actor: "Dr. Sharma", timestamp: "2023-10-15T20:00:00Z", description: "Patient discharged. Vitals stable. Prescribed home meds." },
        { id: "PAT1-E5", type: "lab_report", title: "Lab Report", actor: "Lab Tech", timestamp: "2023-10-14T15:30:00Z", description: "Blood Test Results: WBC Normal, Platelets 1.5L. Malaria Negative." },
        { id: "PAT1-E6", type: "procedure", title: "Procedure", actor: "Sister Mary", timestamp: "2023-10-13T23:30:00Z", description: "Evening Rounds: BP 118/78. Diet tolerated well." },
        { id: "PAT1-E7", type: "procedure", title: "Procedure", actor: "Dr. Verma", timestamp: "2023-10-13T14:30:00Z", description: "Morning Rounds: Fever subsided. Chest clear on auscultation." },
        { id: "PAT1-E8", type: "admission", title: "Admission", actor: "Dr. Sharma", timestamp: "2023-10-12T16:30:00Z", description: "Admitted to General Ward Male, Bed G-102. IV fluids started." },
        { id: "PAT1-E9", type: "consultation", title: "Consultation", actor: "Dr. Sharma", timestamp: "2023-10-12T15:45:00Z", description: "Diagnosed with Viral Fever & Dehydration. Recommended Admission." },
        { id: "PAT1-E10", type: "vitals_check", title: "Vitals Check", actor: "Nurse Anjali", timestamp: "2023-10-12T15:15:00Z", description: "Initial Triage Vitals recorded: BP 120/80 mmHg, SpO2 98%, Temp 98.6°F, Weight 65 kg." }
      ],
      "PAT-002": [
        { id: "PAT2-E1", type: "consultation", title: "Consultation", actor: "Dr. Sharma", timestamp: "2026-08-25T11:00:00Z", description: "Follow-up consultation for Hypertension and Routine Checkup." },
        { id: "PAT2-E2", type: "lab_report", title: "Lab Report", actor: "Lab Tech", timestamp: "2026-08-24T14:20:00Z", description: "Lipid Profile Results: Total Cholesterol 190 mg/dL, Triglycerides 140 mg/dL." },
        { id: "PAT2-E3", type: "vitals_check", title: "Vitals Check", actor: "Nurse Anjali", timestamp: "2026-08-24T10:45:00Z", description: "Vitals recorded: BP 128/82 mmHg, SpO2 99%, Temp 98.2°F, Weight 58 kg." }
      ],
      "PAT-003": [
        { id: "PAT3-E1", type: "consultation", title: "Consultation", actor: "Dr. Verma", timestamp: "2026-08-26T09:30:00Z", description: "Orthopedic Evaluation for Knee Joint Pain." },
        { id: "PAT3-E2", type: "procedure", title: "Procedure", actor: "Dr. Verma", timestamp: "2026-08-25T16:00:00Z", description: "X-Ray Right Knee performed. Mild osteoarthritic changes noted." },
        { id: "PAT3-E3", type: "vitals_check", title: "Vitals Check", actor: "Nurse Anjali", timestamp: "2026-08-25T09:15:00Z", description: "Vitals recorded: BP 134/86 mmHg, SpO2 97%, Temp 98.4°F, Weight 74 kg." }
      ]
    };

    const extras = defaultTimelines[patientId] || [
      { id: `${patientId}-E1`, type: "consultation", title: "Initial Consultation", actor: "Dr. Sharma", timestamp: "2026-08-25T10:00:00Z", description: `OPD Registration and initial clinical consultation for ${patient.name}.` },
      { id: `${patientId}-E2`, type: "vitals_check", title: "Vitals Check", actor: "Nurse Anjali", timestamp: "2026-08-25T09:45:00Z", description: `Triage Vitals recorded for ${patient.name}.` }
    ];

    // Deduplicate & sort reverse chronologically
    const eventMap = new Map<string, any>();
    [...events, ...extras].forEach((evt) => {
      eventMap.set(evt.id, evt);
    });

    const finalTimeline = Array.from(eventMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const rawAllergies = (patient as any).allergies || [];
    const allergies = Array.isArray(rawAllergies)
      ? rawAllergies.map((a: any, i: number) => (typeof a === "string" ? { id: `A-${i}`, allergen: a } : a))
      : [];

    const rawConditions = (patient as any).chronicConditions || (patient as any).conditions || [];
    const conditions = Array.isArray(rawConditions)
      ? rawConditions.map((c: any, i: number) => (typeof c === "string" ? { id: `C-${i}`, condition: c } : c))
      : [];

    return {
      patient: {
        ...patient,
        UHID: patient.uhid,
        allergies,
        conditions
      },
      consultations,
      vitals,
      labOrders,
      prescriptions,
      admission: admissions[0] || null,
      timeline: finalTimeline
    };
  }

  // --- Relationship Validation ---
  public validateRelationships() {
    const patientIds = new Set(this.getPatients().map((p) => p.id));
    const userIds = new Set(this.getUsers().map((u) => u.id));
    const bedIds = new Set(this.getBeds().map((b) => b.id));

    // Validate Queue
    this.data.queueEntries?.forEach((q: any) => {
      if (!patientIds.has(q.patientId)) {
        console.error(`[Data Validation] Queue entry ${q.id} references missing patientId: ${q.patientId}`);
      }
      if (!userIds.has(q.assignedDoctorId)) {
        console.error(`[Data Validation] Queue entry ${q.id} references missing doctorId: ${q.assignedDoctorId}`);
      }
    });

    // Validate Admissions
    this.data.admissions?.forEach((a: any) => {
      if (!patientIds.has(a.patientId)) {
        console.error(`[Data Validation] Admission ${a.id} references missing patientId: ${a.patientId}`);
      }
      if (!bedIds.has(a.bedId)) {
        console.error(`[Data Validation] Admission ${a.id} references missing bedId: ${a.bedId}`);
      }
      if (!userIds.has(a.doctorId)) {
        console.error(`[Data Validation] Admission ${a.id} references missing doctorId: ${a.doctorId}`);
      }
    });
  }
}

export const mednxtDummyData = new MedNxtDummyDataRepository();
export default mednxtDummyData;
