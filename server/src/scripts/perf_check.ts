import http from "http";
import app from "../app.js";
import { prisma } from "../utils/prisma.js";
import { generateToken } from "../utils/jwt.js";
import { UserRole } from "@prisma/client";

function request(
  serverPort: number,
  method: string,
  path: string,
  headers: Record<string, string> = {}
): Promise<{ statusCode: number; durationMs: number; requestId: string }> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: serverPort,
        path,
        method,
        headers
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          const durationMs = Date.now() - start;
          const requestId = (res.headers["x-request-id"] as string) || "N/A";
          resolve({ statusCode: res.statusCode || 500, durationMs, requestId });
        });
      }
    );

    req.on("error", (err) => reject(err));
    req.end();
  });
}

async function runPerfCheck() {
  const adminUser = await prisma.user.findFirst({ where: { role: UserRole.ADMIN, status: "ACTIVE", deletedAt: null } });
  const doctorUser = await prisma.user.findFirst({ where: { role: UserRole.DOCTOR, status: "ACTIVE", deletedAt: null } });
  if (!adminUser || !doctorUser) throw new Error("Missing seed users");

  const adminToken = generateToken({ userId: adminUser.id, role: adminUser.role });
  const doctorToken = generateToken({ userId: doctorUser.id, role: doctorUser.role });

  const server = http.createServer(app);
  await new Promise<void>((res) => server.listen(0, "127.0.0.1", () => res()));
  const port = (server.address() as any).port;

  const endpoints = [
    { name: "Application Health", method: "GET", path: "/api/health", token: null },
    { name: "Database Readiness Check", method: "GET", path: "/api/health/ready", token: null },
    { name: "Dashboard Metrics", method: "GET", path: "/api/dashboard", token: doctorToken },
    { name: "User Directory", method: "GET", path: "/api/users", token: adminToken },
    { name: "Patient Search Directory", method: "GET", path: "/api/patients", token: adminToken },
    { name: "System Audit Logs", method: "GET", path: "/api/audit", token: adminToken }
  ];

  console.log("==================================================");
  console.log("MEDNXT LIGHTWEIGHT PERFORMANCE VERIFICATION RESULTS");
  console.log("==================================================");

  for (const ep of endpoints) {
    const headers: Record<string, string> = {};
    if (ep.token) headers["Authorization"] = `Bearer ${ep.token}`;

    const res = await request(port, ep.method, ep.path, headers);
    console.log(`Endpoint: ${ep.path} [${ep.method}]`);
    console.log(`  Name:          ${ep.name}`);
    console.log(`  Status:        ${res.statusCode}`);
    console.log(`  Response Time: ${res.durationMs} ms`);
    console.log(`  Request ID:    ${res.requestId}`);
    console.log("--------------------------------------------------");
  }

  server.close();
}

runPerfCheck().catch(console.error);
