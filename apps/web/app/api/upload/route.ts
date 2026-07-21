import { NextResponse } from "next/server";
import { auth } from "@hrms-app/auth";
import { z } from "zod";

// Single path-safe segment — no dots, slashes or traversal sequences, so the
// client-supplied category cannot escape the tenant's storage prefix (API-005).
const categorySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/);

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/** Verify the file's leading bytes match its claimed type (F3 / SEC-009). */
function magicBytesMatch(mime: string, bytes: Uint8Array): boolean {
  const startsWith = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  switch (mime) {
    case "application/pdf":
      return startsWith([0x25, 0x50, 0x44, 0x46]); // %PDF
    case "image/png":
      return startsWith([0x89, 0x50, 0x4e, 0x47]); // \x89PNG
    case "image/jpeg":
      return startsWith([0xff, 0xd8, 0xff]);
    // DOCX (and modern Office) are ZIP containers: "PK\x03\x04".
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return startsWith([0x50, 0x4b, 0x03, 0x04]);
    // Legacy .doc (OLE compound): D0 CF 11 E0.
    case "application/msword":
      return startsWith([0xd0, 0xcf, 0x11, 0xe0]);
    default:
      return false;
  }
}
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
    const categoryResult = categorySchema.safeParse(formData.get("category"));

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!categoryResult.success) {
      return NextResponse.json(
        { error: "Invalid category. Use letters, numbers, underscores or hyphens only." },
        { status: 400 }
      );
    }
    const category = categoryResult.data;

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

    // Magic-byte validation — do not trust the client-supplied MIME (F3).
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!magicBytesMatch(file.type, bytes.subarray(0, 8))) {
      return NextResponse.json(
        { error: "File content does not match its declared type." },
        { status: 400 }
      );
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const timestamp = Date.now();
    const storagePath = `${tenantId}/${category}/${timestamp}_${safeFileName}`;

    // Remote object storage only — never write user uploads into the web root.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY not set — uploads are disabled (no web-root fallback).");
      return NextResponse.json({ error: "File storage is not configured." }, { status: 503 });
    }

    const uploadRes = await fetch(`${SUPABASE_STORAGE_URL}/policies/${storagePath}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": file.type,
        "x-upsert": "true",
      },
      body: bytes,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("Supabase upload failed:", errText);
      return NextResponse.json({ error: "Upload failed" }, { status: 502 });
    }

    const publicUrl = `${PUBLIC_STORAGE_URL}/policies/${storagePath}`;
    return NextResponse.json({ url: publicUrl, storagePath });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
