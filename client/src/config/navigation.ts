import {
  LayoutDashboard,
  Users,
  Stethoscope,
  FileText,
  Activity,
  Bed,
  FlaskConical,
  Pill,
  Package,
  Calendar,
  UserCheck,
  ClipboardPlus,
  LucideIcon
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
}

export const ALL_NAV_ITEMS: Record<string, NavItem> = {
  dashboard: {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard
  },
  patientDirectory: {
    id: "patients",
    label: "Patient Directory",
    path: "/patients",
    icon: Users
  },
  appointments: {
    id: "appointments",
    label: "Appointments",
    path: "/appointments",
    icon: Calendar
  },
  registration: {
    id: "registration",
    label: "Registration",
    path: "/registration",
    icon: ClipboardPlus
  },
  patientQueue: {
    id: "patient-queue",
    label: "Patient Queue",
    path: "/patient-queue",
    icon: Users
  },
  doctorStation: {
    id: "doctor-station",
    label: "Doctor Station",
    path: "/doctor-station",
    icon: Stethoscope
  },
  patientHistory: {
    id: "patient-history",
    label: "Patient History",
    path: "/patient-history",
    icon: FileText
  },
  ipdWards: {
    id: "ipd-wards",
    label: "IPD & Wards",
    path: "/ipd-wards",
    icon: Bed
  },
  laboratory: {
    id: "laboratory",
    label: "Laboratory",
    path: "/laboratory",
    icon: FlaskConical
  },
  pharmacy: {
    id: "pharmacy",
    label: "Pharmacy",
    path: "/pharmacy",
    icon: Pill
  },
  inventoryAssets: {
    id: "inventory-assets",
    label: "Inventory & Assets",
    path: "/inventory",
    icon: Package
  },
  billingClaims: {
    id: "billing-claims",
    label: "Billing & Claims",
    path: "/billing",
    icon: FileText
  },
  analytics: {
    id: "analytics",
    label: "Analytics",
    path: "/analytics",
    icon: Activity
  },
  userManagement: {
    id: "users",
    label: "Admin Panel",
    path: "/admin",
    icon: UserCheck
  }
};

export const ROLE_NAVIGATION_MAP: Record<string, string[]> = {
  DOCTOR: [
    "dashboard",
    "patientQueue",
    "doctorStation",
    "patientHistory",
    "ipdWards",
    "laboratory",
    "pharmacy"
  ],
  NURSE: [
    "dashboard",
    "patientDirectory",
    "patientHistory",
    "ipdWards"
  ],
  LAB_TECHNICIAN: [
    "dashboard",
    "laboratory"
  ],
  PATHOLOGIST: [
    "dashboard",
    "laboratory"
  ],
  PHARMACIST: [
    "dashboard",
    "pharmacy"
  ],
  RECEPTIONIST: [
    "dashboard",
    "registration",
    "patientQueue",
    "billingClaims"
  ],
  ADMIN: [
    "dashboard",
    "userManagement",
    "registration",
    "patientQueue",
    "doctorStation",
    "patientHistory",
    "ipdWards",
    "laboratory",
    "pharmacy",
    "inventoryAssets",
    "billingClaims",
    "analytics"
  ],
  SUPER_ADMIN: [
    "dashboard",
    "userManagement",
    "registration",
    "patientQueue",
    "doctorStation",
    "patientHistory",
    "ipdWards",
    "laboratory",
    "pharmacy",
    "inventoryAssets",
    "billingClaims",
    "analytics"
  ]
};

export function getNavItemsForRole(role?: string): NavItem[] {
  if (!role || !ROLE_NAVIGATION_MAP[role]) {
    // Default fallback if role is unrecognized: show Dashboard
    return [ALL_NAV_ITEMS.dashboard];
  }
  return ROLE_NAVIGATION_MAP[role]
    .map((key) => ALL_NAV_ITEMS[key])
    .filter(Boolean);
}
