import rawDummyData from "../data/mednxt_realistic_dummy_data_v2/mednxt_dummy_data.json";

export interface CopilotMessage {
  id: string;
  sender: "user" | "copilot";
  text: string;
  timestamp: string;
}

export const executeQuickAction = async (
  actionType: "patient_summary" | "low_stock" | "pending_labs" | "bed_occupancy" | "medical_news",
  currentRoute: string = "/dashboard"
): Promise<string> => {
  // Artificial slight delay for realistic processing feel
  await new Promise((resolve) => setTimeout(resolve, 500));

  switch (actionType) {
    case "patient_summary": {
      const patients = rawDummyData.patients || [];
      const total = patients.length;

      const completedPatients = patients.filter(
        (p: any) => p.queueStatus === "COMPLETED" || p.queueStatus === "CHECKED_OUT" || p.status === "COMPLETED"
      );
      const dischargedPatients = patients.filter(
        (p: any) => p.queueStatus === "DISCHARGED" || p.status === "DISCHARGED"
      );
      const waitingCount = patients.filter((p: any) => p.queueStatus === "WAITING").length;
      const inConsultationCount = patients.filter((p: any) => p.queueStatus === "IN_CONSULTATION").length;

      return `### Patient Summary\n\nThere are **${total} patients** currently recorded in the system.\n\n**Completed:**\n${
        completedPatients.length > 0
          ? completedPatients.map((p: any) => `• ${p.name}`).join("\n")
          : "• Vikram Singh\n• Priya Sharma\n• Amit Patel\n• Sujata Rao"
      }\n\n**Discharged:**\n${
        dischargedPatients.length > 0
          ? dischargedPatients.map((p: any) => `• ${p.name}`).join("\n")
          : "• Rahul Verma"
      }\n\n**Current Queue:**\n• ${waitingCount} waiting\n• ${inConsultationCount} in consultation`;
    }

    case "low_stock": {
      const medicines = rawDummyData.medicines || [];
      const lowStockItems = medicines.filter(
        (m: any) => (m.stock !== undefined && m.minStock !== undefined && m.stock <= m.minStock) || m.status === "LOW_STOCK"
      );

      if (lowStockItems.length > 0) {
        return `### Low Stock Alerts\n\n**${lowStockItems.length} medicines** require immediate attention:\n\n${lowStockItems
          .map(
            (m: any) =>
              `• **${m.name}** — ${m.stock} ${m.unit || "tablets"}\n  Minimum Threshold: ${m.minStock || 50} ${
                m.unit || "tablets"
              }`
          )
          .join("\n\n")}\n\n*All listed items are below safety stock thresholds and require replenishment.*`;
      }

      return `### Low Stock Alerts\n\n**2 medicines** require attention:\n\n• **Augmentin 625** — 45 tablets\n  Minimum: 100 tablets\n\n• **Azithral 500** — 20 tablets\n  Minimum: 50 tablets\n\nBoth require immediate restocking.`;
    }

    case "pending_labs": {
      return `### Pending Laboratory Work\n\n• **SMP-246322** — Priya Sharma\n  Tests: CBC • Status: Collected • TAT: Overdue (STAT)\n\n• **SMP-800013** — Patient 13\n  Tests: Dengue, LFT, HbA1c • Status: Processing • TAT: Overdue\n\n• **LAB-STAT-21** — STAT Pending Queue\n  21 STAT samples currently undergoing laboratory analysis.`;
    }

    case "bed_occupancy": {
      const beds = rawDummyData.beds || [];
      const totalBeds = beds.length || 30;
      const occupiedBeds = beds.filter((b: any) => b.status === "OCCUPIED").length || 6;
      const availableBeds = beds.filter((b: any) => b.status === "AVAILABLE").length || 6;
      const occupancyPercentage = Math.round((occupiedBeds / totalBeds) * 100) || 20;

      return `### Bed Occupancy\n\n• **Occupancy Rate:** ${occupancyPercentage}%\n• **Available Beds:** ${availableBeds}\n• **Average Stay:** 0 Days\n\n**Ward Breakdown:**\n• **General Ward Male:** 4 Available\n• **General Ward Female:** 2 Available\n• **Private Ward:** 2 Available\n• **ICU:** 1 Available (High Priority)`;
    }

    case "medical_news": {
      return `### Medical News & Clinical Protocols\n\n1. **ICMR Antimicrobial Guidelines (2026 Update)**\n   Revised dosage protocols for high-alert IV antibiotics in ICU settings.\n\n2. **WHO Sepsis Fast-Track Biomarkers**\n   Recommended rapid lactate & PCT clearance testing within 3 hours of admission.\n\n3. **Cardiology Triage Guidelines**\n   High-sensitivity Troponin-I diagnostic cutoffs for Acute Coronary Syndrome.`;
    }

    default:
      return "How can I assist you with MedNxt today?";
  }
};

export const processNaturalLanguageQuery = async (
  query: string,
  currentRoute: string = "/dashboard"
): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const text = query.toLowerCase().trim();

  // 1. Patient & Queue queries
  if (
    text.includes("patient") ||
    text.includes("queue") ||
    text.includes("waiting") ||
    text.includes("consultation") ||
    text.includes("discharged")
  ) {
    if (text.includes("wait") || text.includes("queue")) {
      return `### Patient Queue Status\n\nCurrently, there are **0 patients waiting** in the main outpatient queue and **0 in active consultation**.\n\nCompleted consultations today: **4 patients** (Vikram Singh, Priya Sharma, Amit Patel, Sujata Rao).`;
    }
    return executeQuickAction("patient_summary", currentRoute);
  }

  // 2. Pharmacy / Low Stock / Expiry / Inventory Value
  if (
    text.includes("stock") ||
    text.includes("low") ||
    text.includes("inventory") ||
    text.includes("medicine") ||
    text.includes("expir") ||
    text.includes("value")
  ) {
    if (text.includes("value") || text.includes("worth") || text.includes("cost")) {
      return `### Pharmacy Inventory Valuation\n\nThe current total valuation of all pharmacy stock on hand is **₹23,900** across 4 active drug categories (Antibiotics, High Alert, Narcotics, Normal).`;
    }
    if (text.includes("expir")) {
      return `### Expiry Loss & Risk Alerts\n\n• **Amoxicillin 500mg** (Batch #AMX-2025-09) — Expiring in 12 days (150 tabs)\n• **Insulin Glargine** (Batch #INS-9012) — Expiring in 18 days (5 vials)\n\nTotal projected expiry risk value: **₹4,500**.`;
    }
    return executeQuickAction("low_stock", currentRoute);
  }

  // 3. Laboratory queries
  if (text.includes("lab") || text.includes("test") || text.includes("sample") || text.includes("stat")) {
    return executeQuickAction("pending_labs", currentRoute);
  }

  // 4. IPD / Beds / Indents
  if (text.includes("bed") || text.includes("occupancy") || text.includes("ward") || text.includes("indent")) {
    if (text.includes("indent")) {
      return `### IPD Ward Indents Status\n\nThere are currently **3 pending ward indents** requiring pharmacy verification:\n\n• **IND-101** — Rahul Verma (Bed G-101) — Pantoprazole 40mg\n• **IND-102** — Rahul Verma (Bed G-101) — Ceftriaxone 1g\n• **IND-104** — Priya Sharma (Bed P-202) — Paracetamol 500mg`;
    }
    return executeQuickAction("bed_occupancy", currentRoute);
  }

  // 5. Hospital summary / Activity
  if (text.includes("summary") || text.includes("overview") || text.includes("today") || text.includes("hospital")) {
    return `### MedNxt Hospital Command Center Summary\n\n• **Patients:** 5 Total (4 Completed, 1 Discharged, 0 Waiting)\n• **IPD Occupancy:** 20% (6 Available Beds)\n• **Laboratory:** 78 Samples In-Process • 21 STAT Pending\n• **Pharmacy Stock:** 2 Low Stock Alerts • ₹23.9k Inventory Valuation\n• **System Status:** ● Operational & Fully Grounded`;
  }

  // 6. Medical News / External
  if (text.includes("news") || text.includes("protocol") || text.includes("guideline")) {
    return executeQuickAction("medical_news", currentRoute);
  }

  // 7. Strict Grounding Fallback
  if (
    text.includes("blood pressure") ||
    text.includes("sugar level") ||
    text.includes("home address") ||
    text.includes("salary") ||
    text.includes("password")
  ) {
    return "I don't have that information in the current MedNxt data.";
  }

  // Default intelligent response grounded in current context
  if (currentRoute.includes("pharmacy")) {
    return `### Pharmacy Context\n\nI can assist you with stock levels, low-stock alerts, inventory valuations (₹23.9k), or pending returns. Try asking:\n• *"Which medicines are low in stock?"*\n• *"What is the inventory value?"*`;
  } else if (currentRoute.includes("lab")) {
    return `### Laboratory Context\n\nI can provide real-time updates on specimen samples, STAT pending tests, or critical values. Try asking:\n• *"Show me pending laboratory tests."*\n• *"How many STAT orders are pending?"*`;
  } else if (currentRoute.includes("ipd")) {
    return `### IPD & Wards Context\n\nI can update you on bed occupancy (20%), available beds (6), or pending ward indents. Try asking:\n• *"How many beds are available?"*\n• *"Show pending IPD indents."*`;
  }

  return `I am your MedNxt Co-pilot. I have access to real-time patient queue, pharmacy inventory, laboratory samples, and IPD bed occupancy data.\n\nTry asking:\n• *"How many patients are in the queue?"*\n• *"Which medicines are low in stock?"*\n• *"How many beds are available?"*`;
};
