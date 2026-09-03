import axios, { InternalAxiosRequestConfig } from "axios";
import { mednxtDummyData } from "../data/mednxtDummyData";

const API_URL = import.meta.env.VITE_API_URL || "/api";
export const USE_DUMMY_DATA = import.meta.env.VITE_USE_DUMMY_DATA !== "false";

const demoLoginAliases: Record<string, string> = {
  doctor: "dr.rohan.sharma@mednxt.demo",
  admin: "admin@mednxt.demo",
  receptionist: "frontdesk@mednxt.demo"
};

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("mednxt_auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const defaultAdapter = axios.getAdapter(axios.defaults.adapter || "xhr");

// If USE_DUMMY_DATA is true, handle mock responses deterministically
if (USE_DUMMY_DATA) {
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const url = config.url || "";

    // 0. Authentication Endpoints: Pass through to backend first, with offline dev fallback
    if (url.includes("/auth/")) {
      try {
        return await defaultAdapter(config);
      } catch (err: any) {
        if (err.response) {
          throw err;
        }
        // Handle mock authentication when backend is offline
        if (url.includes("/auth/login")) {
          let body: any = {};
          try {
            body = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
          } catch {
            // Ignore malformed mock payloads and use defaults.
          }

          const { email, password } = body;
          if (!email || !password) {
            const errorRes: any = new Error("Request failed with status code 400");
            errorRes.response = {
              status: 400,
              data: { success: false, error: { message: "Email and password are required" } }
            };
            throw errorRes;
          }

          const identifier = String(email).trim().toLowerCase();
          const user = mednxtDummyData.getUserByEmail(demoLoginAliases[identifier] || identifier);
          if (user && password === "password") {
            return {
              data: {
                success: true,
                data: {
                  token: `mock-token-${user.id}`,
                  user
                }
              },
              status: 200,
              statusText: "OK",
              headers: {},
              config
            };
          } else {
            const errorRes: any = new Error("Request failed with status code 401");
            errorRes.response = {
              status: 401,
              data: { success: false, error: { message: "Invalid email or password" } }
            };
            throw errorRes;
          }
        }

        if (url.includes("/auth/me")) {
          const authHeader = (config.headers?.Authorization as string) || "";
          let userId = "USR-DOC-001";
          if (authHeader.includes("mock-token-")) {
            userId = authHeader.split("mock-token-")[1]?.split(" ")[0] || "USR-DOC-001";
          }
          const user = mednxtDummyData.getUserById(userId) || mednxtDummyData.getUserById("USR-DOC-001");
          if (user) {
            return {
              data: {
                success: true,
                data: { user }
              },
              status: 200,
              statusText: "OK",
              headers: {},
              config
            };
          } else {
            const errorRes: any = new Error("Request failed with status code 401");
            errorRes.response = {
              status: 401,
              data: { success: false, error: { message: "User not authenticated" } }
            };
            throw errorRes;
          }
        }

        throw err;
      }
    }

    // 1. IPD Endpoint
    if (url.includes("/ipd")) {
      return {
        data: {
          success: true,
          data: mednxtDummyData.getIPDDashboardData()
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    // 2. Patient History Search / Single Patient
    if (url.includes("/history/patients")) {
      const queryParam = url.split("query=")[1];
      const query = queryParam ? decodeURIComponent(queryParam.split("&")[0]) : "";
      return {
        data: {
          success: true,
          data: mednxtDummyData.searchPatients(query)
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    if (url.includes("/history/patient/")) {
      const patientId = url.split("/history/patient/")[1]?.split("?")[0];
      const historyData = mednxtDummyData.getPatientHistoryTimeline(patientId);
      return {
        data: {
          success: true,
          data: historyData
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    // 3. Queue & Appointments
    if (url.includes("/queue") || url.includes("/doctor-station/queue")) {
      const method = (config.method || "get").toLowerCase();
      if (method === "patch") {
        let body: any = {};
        try {
          body = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
        } catch {
          // Ignore malformed mock payloads and use defaults.
        }
        const queueId = url.split("/queue/")[1]?.split("/")[0] || url.split("/doctor-station/queue/")[1]?.split("/")[0];
        if (queueId && body.status) {
          mednxtDummyData.updateQueueEntryStatus(queueId, body.status);
        }
        return {
          data: {
            success: true,
            data: { message: "Status updated successfully" }
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config
        };
      }

      return {
        data: {
          success: true,
          data: {
            entries: mednxtDummyData.getQueueEntries(),
            queue: mednxtDummyData.getQueueEntries()
          }
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    if (url.includes("/doctor-station/patient/")) {
      const patientId = url.split("/doctor-station/patient/")[1]?.split("?")[0];
      const patient = mednxtDummyData.getPatientById(patientId);
      const latestVitals = mednxtDummyData.getLatestVitalsByPatientId(patientId);
      return {
        data: {
          success: true,
          data: {
            patient,
            latestVitals,
            allergies: patient?.allergies || [],
            chronicConditions: patient?.chronicConditions || []
          }
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    if (url.includes("/appointments")) {
      return {
        data: {
          success: true,
          data: mednxtDummyData.getAppointments()
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    // 4. Dashboard Analytics
    if (url.includes("/dashboard")) {
      return {
        data: {
          success: true,
          data: mednxtDummyData.getDashboardAnalytics()
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    // 5. Consultations & Vitals
    if (url.includes("/consultations/start")) {
      let bodyData: any = {};
      try {
        bodyData = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
      } catch {
        // Ignore malformed mock payloads and use defaults.
      }
      const pid = bodyData.patientId || "PAT-001";
      const consultation = mednxtDummyData.getConsultationByPatientId(pid) || {
        id: "CON-001",
        patientId: pid,
        doctorId: "USR-DOC-001",
        status: "COMPLETED",
        subjective: "Patient reports high fever and chills for two days.",
        objective: "Temperature 101.8°F. Mild dehydration.",
        assessment: "Viral fever with dehydration.",
        plan: "Oral fluids, antipyretic, follow-up if symptoms worsen.",
        icd10: "R50.9"
      };
      const latestVital = mednxtDummyData.getLatestVitalsByPatientId(pid);
      return {
        data: {
          success: true,
          data: {
            consultation,
            latestVital,
            labOrders: mednxtDummyData.getLabOrders().filter((l) => l.patientId === pid)
          }
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    if (url.includes("/consultations/lab-tests")) {
      const catalog = [
        { id: "TEST-CBC", code: "CBC", name: "Complete Blood Count", department: "Hematology", category: "Hematology" },
        { id: "TEST-LFT", code: "LFT", name: "Liver Function Test", department: "Biochemistry", category: "Biochemistry" },
        { id: "TEST-KFT", code: "KFT", name: "Kidney Function Test", department: "Biochemistry", category: "Biochemistry" },
        { id: "TEST-LIPID", code: "LIPID", name: "Lipid Profile", department: "Biochemistry", category: "Biochemistry" },
        { id: "TEST-TSH", code: "TSH", name: "Thyroid Stimulating Hormone", department: "Endocrinology", category: "Endocrinology" }
      ];
      return {
        data: {
          success: true,
          data: catalog
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    if (url.includes("/lab-orders") && config.method?.toLowerCase() === "post") {
      let bodyData: any = {};
      try {
        bodyData = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
      } catch {
        // Ignore malformed mock payloads and use defaults.
      }
      const nowIso = new Date().toISOString();
      const newOrder = {
        id: `LAB-${Date.now().toString().slice(-6)}`,
        patientId: bodyData.patientId || "PAT-001",
        doctorId: bodyData.doctorId || "USR-DOC-001",
        priority: bodyData.priority || "ROUTINE",
        status: "COLLECTED",
        createdAt: nowIso,
        collectedAt: nowIso,
        items: (bodyData.testIds || ["TEST-CBC"]).map((tid: string) => ({
          test: { id: tid, name: tid }
        }))
      };

      mednxtDummyData.addLabOrder(newOrder);

      return {
        data: {
          success: true,
          data: newOrder
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    if (url.includes("/consultations/medicines")) {
      const searchParam = url.split("search=")[1]?.split("&")[0] || "";
      const search = decodeURIComponent(searchParam).toLowerCase().trim();
      const allMeds = mednxtDummyData.getMedicines();
      const filtered = search
        ? allMeds.filter(
            (m: any) =>
              m.name.toLowerCase().includes(search) ||
              (m.genericName || "").toLowerCase().includes(search)
          )
        : allMeds;

      return {
        data: {
          success: true,
          data: filtered
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    if (url.includes("/prescriptions") && config.method?.toLowerCase() === "post") {
      let bodyData: any = {};
      try {
        bodyData = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
      } catch {
        // Ignore malformed mock payloads and use defaults.
      }
      const newRx = {
        id: `RX-${Date.now().toString().slice(-6)}`,
        status: "SENT_TO_PHARMACY",
        createdAt: new Date().toISOString(),
        items: (bodyData.items || []).map((item: any) => {
          const med = mednxtDummyData.getMedicines().find((m: any) => m.id === item.medicineId);
          return {
            ...item,
            medicine: med || { name: item.medicineName || "Medication" }
          };
        })
      };

      return {
        data: {
          success: true,
          data: newRx
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    if (url.includes("/consultations")) {
      return {
        data: {
          success: true,
          data: mednxtDummyData.getConsultations()
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    // 6. Pharmacy & Laboratory
    if (url.includes("/pharmacy")) {
      if (url.includes("/pharmacy/inventory") || url.includes("/pharmacy/medicines")) {
        if (config.method?.toLowerCase() === "put" || config.method?.toLowerCase() === "patch") {
          const parts = url.split("/");
          const medId = parts[parts.length - 1]?.split("?")[0] || "";
          let bodyData: any = {};
          try {
            bodyData = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
          } catch {
            // Ignore malformed mock payloads and use defaults.
          }

          const res = mednxtDummyData.updateMedicine(medId, bodyData);
          return {
            data: { success: true, data: res.medicine },
            status: 200,
            statusText: "OK",
            headers: {},
            config
          };
        }

        if (config.method?.toLowerCase() === "post") {
          let bodyData: any = {};
          try {
            bodyData = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
          } catch {
            // Ignore malformed mock payloads and use defaults.
          }

          const res = mednxtDummyData.addMedicine(bodyData);
          return {
            data: { success: true, data: res.medicine },
            status: 200,
            statusText: "OK",
            headers: {},
            config
          };
        }
      }

      if (url.includes("/pharmacy/returns/") && url.includes("/process")) {
        const parts = url.split("/");
        const returnId = parts[parts.indexOf("returns") + 1] || "";
        let bodyData: any = {};
        try {
          bodyData = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
        } catch {
          // Ignore malformed mock payloads and use defaults.
        }
        const action = bodyData.action || "restock";

        const res = mednxtDummyData.processReturnRequest(returnId, action);
        if (res.success) {
          return {
            data: { success: true, message: res.message },
            status: 200,
            statusText: "OK",
            headers: {},
            config
          };
        } else {
          const errorRes: any = new Error(res.message || "Failed to process return request");
          errorRes.response = {
            status: 400,
            data: { success: false, error: { message: res.message || "Failed to process return request" } }
          };
          throw errorRes;
        }
      }

      if (url.includes("/pharmacy/indents/") && url.includes("/fulfill")) {
        const parts = url.split("/");
        const indentId = parts[parts.indexOf("indents") + 1] || "";
        const res = mednxtDummyData.fulfillIPDIndent(indentId);
        if (res.success) {
          return {
            data: { success: true, message: res.message },
            status: 200,
            statusText: "OK",
            headers: {},
            config
          };
        } else {
          const errorRes: any = new Error(res.message || "Failed to fulfill indent");
          errorRes.response = {
            status: 400,
            data: { success: false, error: { message: res.message || "Failed to fulfill indent" } }
          };
          throw errorRes;
        }
      }

      if (url.includes("/pharmacy/prescriptions/")) {
        const parts = url.split("/pharmacy/prescriptions/");
        const prescriptionId = parts[1]?.split("?")[0]?.split("/")[0];
        return {
          data: {
            success: true,
            data: mednxtDummyData.getPrescriptionDetailsById(prescriptionId)
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config
        };
      }

      return {
        data: {
          success: true,
          data: mednxtDummyData.getPharmacyData()
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    if (url.includes("/laboratory") || url.includes("/lab")) {
      if (url.includes("/results") && config.method?.toLowerCase() === "post") {
        const parts = url.split("/");
        const orderId = parts[parts.indexOf("orders") + 1] || "";
        let bodyData: any = {};
        try {
          bodyData = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
        } catch {
          // Ignore malformed mock payloads and use defaults.
        }

        const res = mednxtDummyData.addLabResults(orderId, bodyData);
        return {
          data: { success: true, data: res.order },
          status: 200,
          statusText: "OK",
          headers: {},
          config
        };
      }

      if (url.includes("/collect")) {
        const parts = url.split("/");
        let orderId = "";
        if (parts.includes("orders")) {
          orderId = parts[parts.indexOf("orders") + 1] || "";
        } else {
          orderId = parts[parts.length - 2] || "";
        }
        let bodyData: any = {};
        try {
          bodyData = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
        } catch {
          // Ignore malformed mock payloads and use defaults.
        }

        const targetId = orderId || bodyData.orderId || bodyData.sampleId || "";
        const res = mednxtDummyData.collectLabOrder(targetId);
        if (res.success) {
          return {
            data: { success: true, data: res.order },
            status: 200,
            statusText: "OK",
            headers: {},
            config
          };
        } else {
          const errorRes: any = new Error(res.message || "Failed to collect sample");
          errorRes.response = {
            status: 400,
            data: { success: false, error: { message: res.message || "Failed to collect sample" } }
          };
          throw errorRes;
        }
      }

      return {
        data: {
          success: true,
          data: mednxtDummyData.getLaboratoryDashboardData()
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    // 7. Admin: users and audit logs
    if (url.includes("/users")) {
      const method = (config.method || "get").toLowerCase();
      const users = mednxtDummyData.raw.users as any[];
      const userId = url.split("/users/")[1]?.split("/")[0];
      const target = users.find((u) => u.id === userId);

      if (method === "get") {
        if (target) {
          return {
            data: {
              success: true,
              data: {
                ...target,
                createdAt: target.createdAt || "2026-08-26T09:00:00.000Z",
                updatedAt: target.updatedAt || "2026-08-26T09:00:00.000Z",
                operationalMetrics: {
                  assignedQueueEntriesCount: 0,
                  activeConsultationsCount: 0,
                  activeAdmissionsCount: 0,
                  labOrdersCount: 0,
                  scheduledAppointmentsCount: 0
                }
              }
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config
          };
        }

        const params = (config.params || {}) as Record<string, any>;
        const page = Number(params.page || 1);
        const limit = Number(params.limit || 15);
        const search = String(params.search || "").toLowerCase().trim();
        const role = params.role;
        const department = params.department;
        const status = params.status;

        let filtered = users.filter((u) => !u.deletedAt);
        if (search) {
          filtered = filtered.filter((u) =>
            [u.name, u.email, u.phone, u.role, u.department, u.specialization]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(search))
          );
        }
        if (role) filtered = filtered.filter((u) => u.role === role);
        if (department) filtered = filtered.filter((u) => u.department === department);
        if (status) filtered = filtered.filter((u) => u.status === status);

        const activeUsers = users.filter((u) => !u.deletedAt);
        const start = (page - 1) * limit;
        return {
          data: {
            success: true,
            data: {
              metrics: {
                totalStaff: activeUsers.length,
                activeStaff: activeUsers.filter((u) => u.status === "ACTIVE").length,
                doctorsCount: activeUsers.filter((u) => u.role === "DOCTOR").length,
                nursesCount: activeUsers.filter((u) => u.role === "NURSE").length,
                inactiveOrSuspendedCount: activeUsers.filter((u) => u.status !== "ACTIVE").length
              },
              pagination: {
                total: filtered.length,
                page,
                limit,
                totalPages: Math.max(1, Math.ceil(filtered.length / limit))
              },
              users: filtered.slice(start, start + limit).map((u) => ({
                ...u,
                createdAt: u.createdAt || "2026-08-26T09:00:00.000Z",
                updatedAt: u.updatedAt || "2026-08-26T09:00:00.000Z"
              }))
            }
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config
        };
      }

      if (method === "post" && !url.includes("/reset-password")) {
        let bodyData: any = {};
        try {
          bodyData = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
        } catch {
          // Ignore malformed mock payloads and use defaults.
        }
        const newUser = {
          id: `USR-${Date.now().toString().slice(-6)}`,
          name: bodyData.name,
          email: bodyData.email,
          phone: bodyData.phone || "",
          role: bodyData.role,
          department: bodyData.department || "Administration",
          specialization: bodyData.specialization || "",
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        users.unshift(newUser);
        return { data: { success: true, data: newUser }, status: 200, statusText: "OK", headers: {}, config };
      }

      if (target && method === "patch" && url.includes("/status")) {
        let bodyData: any = {};
        try {
          bodyData = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
        } catch {
          // Ignore malformed mock payloads and use defaults.
        }
        target.status = bodyData.status || target.status;
        target.updatedAt = new Date().toISOString();
        return { data: { success: true, data: target }, status: 200, statusText: "OK", headers: {}, config };
      }
      if (target && method === "patch") {
        let bodyData: any = {};
        try {
          bodyData = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
        } catch {
          // Ignore malformed mock payloads and use defaults.
        }
        Object.assign(target, bodyData, { updatedAt: new Date().toISOString() });
        return { data: { success: true, data: target }, status: 200, statusText: "OK", headers: {}, config };
      }
      if (target && method === "post" && url.includes("/reset-password")) {
        return {
          data: { success: true, data: { success: true, message: "User password reset successfully" } },
          status: 200,
          statusText: "OK",
          headers: {},
          config
        };
      }
      if (target && method === "delete") {
        target.deletedAt = new Date().toISOString();
        target.status = "INACTIVE";
        return {
          data: { success: true, data: { success: true, message: "User deleted", deletedUserId: target.id } },
          status: 200,
          statusText: "OK",
          headers: {},
          config
        };
      }
    }

    if (url.includes("/audit")) {
      const logs = mednxtDummyData.getAuditLogs();
      return {
        data: {
          success: true,
          data: {
            pagination: {
              total: logs.length,
              page: 1,
              limit: logs.length,
              totalPages: 1
            },
            logs
          }
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    // Fallback for any unhandled GET endpoints
    return {
      data: {
        success: true,
        data: []
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config
    };
  };
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("mednxt_auth_token");
    }
    return Promise.reject(error);
  }
);
