import { NextResponse } from "next/server";
import { auth } from "@hrms-app/auth";
import fs from "fs";
import path from "path";
import { mkdir } from "fs/promises";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPABASE_PROJECT_ID = "iefwhxxhrycaalhxkfgp";
const SUPABASE_STORAGE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object`;
const PUBLIC_STORAGE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public`;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const timestamp = Date.now();
    const storagePath = `${tenantId}/${category}/${timestamp}_${safeFileName}`;

    // Try Supabase Storage first
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (serviceRoleKey) {
      try {
        const uploadRes = await fetch(
          `${SUPABASE_STORAGE_URL}/policies/${storagePath}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceRoleKey}`,
              "Content-Type": file.type,
              "x-upsert": "true",
            },
            body: await file.arrayBuffer(),
          }
        );

        if (uploadRes.ok) {
          const publicUrl = `${PUBLIC_STORAGE_URL}/policies/${storagePath}`;
          return NextResponse.json({ url: publicUrl, storagePath });
        } else {
          const errText = await uploadRes.text();
          console.error("Supabase upload failed:", errText);
          // Fall through to local storage
        }
      } catch (err) {
        console.error("Supabase upload error:", err);
        // Fall through to local storage
      }
    } else {
      console.warn("SUPABASE_SERVICE_ROLE_KEY not set — using local storage fallback");
    }

    // Local fallback: store in public/uploads/
    const localDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      tenantId,
      category ?? "unknown"
    );
    await mkdir(localDir, { recursive: true });

    const localFileName = `${timestamp}_${safeFileName}`;
    const localFilePath = path.join(localDir, localFileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(localFilePath, buffer);

    const publicUrl = `/uploads/${tenantId}/${category ?? "unknown"}/${localFileName}`;
    return NextResponse.json({ url: publicUrl, storagePath: publicUrl, local: true });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
