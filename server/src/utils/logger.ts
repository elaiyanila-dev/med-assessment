export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface LogPayload {
  timestamp?: string;
  level?: LogLevel;
  requestId?: string;
  method?: string;
  route?: string;
  statusCode?: number;
  durationMs?: number;
  userId?: string;
  role?: string;
  code?: string;
  message?: string;
  error?: any;
  [key: string]: any;
}

const REDACTED_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "authorization",
  "jwtsecret",
  "databaseurl",
  "secret",
  "creditcard"
]);

function sanitize(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      clean[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      clean[key] = sanitize(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const logger = {
  log: (level: LogLevel, message: string, meta: LogPayload = {}) => {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...sanitize(meta)
    };

    const formatted = JSON.stringify(entry);
    if (level === "ERROR") {
      console.error(formatted);
    } else if (level === "WARN") {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  },
  info: (message: string, meta?: LogPayload) => logger.log("INFO", message, meta),
  warn: (message: string, meta?: LogPayload) => logger.log("WARN", message, meta),
  error: (message: string, meta?: LogPayload) => logger.log("ERROR", message, meta)
};
