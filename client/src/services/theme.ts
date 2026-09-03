export const BRAND_THEME_STORAGE_KEY = "mednxt_brand_theme_color";
export const DEFAULT_BRAND_COLOR = "#10b981";

type BrandPalette = {
  50: string;
  100: string;
  200: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
  sidebarFrom: string;
  sidebarVia: string;
  sidebarTo: string;
};

const palettes: Record<string, BrandPalette> = {
  "#4f46e5": {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
    950: "#1e1b4b",
    sidebarFrom: "#312e81",
    sidebarVia: "#3730a3",
    sidebarTo: "#1e1b4b"
  },
  "#2563eb": {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
    sidebarFrom: "#1e3a8a",
    sidebarVia: "#1e40af",
    sidebarTo: "#172554"
  },
  "#10b981": {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
    950: "#022c22",
    sidebarFrom: "#064e3b",
    sidebarVia: "#065f46",
    sidebarTo: "#134e4a"
  },
  "#e11d48": {
    50: "#fff1f2",
    100: "#ffe4e6",
    200: "#fecdd3",
    400: "#fb7185",
    500: "#f43f5e",
    600: "#e11d48",
    700: "#be123c",
    800: "#9f1239",
    900: "#881337",
    950: "#4c0519",
    sidebarFrom: "#881337",
    sidebarVia: "#9f1239",
    sidebarTo: "#4c0519"
  },
  "#7c3aed": {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    400: "#a78bfa",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
    950: "#2e1065",
    sidebarFrom: "#4c1d95",
    sidebarVia: "#5b21b6",
    sidebarTo: "#2e1065"
  },
  "#475569": {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
    sidebarFrom: "#334155",
    sidebarVia: "#1e293b",
    sidebarTo: "#020617"
  }
};

export const getSavedBrandTheme = () => {
  if (typeof window === "undefined") return DEFAULT_BRAND_COLOR;
  return window.localStorage.getItem(BRAND_THEME_STORAGE_KEY) || DEFAULT_BRAND_COLOR;
};

export const applyBrandTheme = (color: string) => {
  const selectedColor = palettes[color] ? color : DEFAULT_BRAND_COLOR;
  const palette = palettes[selectedColor];
  const root = document.documentElement;

  root.style.setProperty("--brand-50", palette[50]);
  root.style.setProperty("--brand-100", palette[100]);
  root.style.setProperty("--brand-200", palette[200]);
  root.style.setProperty("--brand-400", palette[400]);
  root.style.setProperty("--brand-500", palette[500]);
  root.style.setProperty("--brand-600", palette[600]);
  root.style.setProperty("--brand-700", palette[700]);
  root.style.setProperty("--brand-800", palette[800]);
  root.style.setProperty("--brand-900", palette[900]);
  root.style.setProperty("--brand-950", palette[950]);
  root.style.setProperty("--brand-sidebar-from", palette.sidebarFrom);
  root.style.setProperty("--brand-sidebar-via", palette.sidebarVia);
  root.style.setProperty("--brand-sidebar-to", palette.sidebarTo);

  window.localStorage.setItem(BRAND_THEME_STORAGE_KEY, selectedColor);
};

