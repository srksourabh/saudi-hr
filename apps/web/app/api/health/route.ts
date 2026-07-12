import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

const startTime = Date.now();

export async function GET() {
  let dbStatus = "disconnected";
  const redisStatus = "disconnected";

  try {
    const { adminDb } = await import("@hrms-app/db");
    await adminDb.execute(sql`SELECT 1`);
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  return NextResponse.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    db: dbStatus,
    redis: redisStatus,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
}
