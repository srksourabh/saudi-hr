import { adminDb, users } from "@hrms-app/db";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";

async function test() {
  const user = await adminDb.query.users.findFirst({
    where: eq(users.email, "admin@demo.com"),
  });

  if (!user) { console.log("User not found"); process.exit(1); }
  if (!user.passwordHash) { console.log("No password hash"); process.exit(1); }

  console.log("User found:", user.email);
  console.log("Hash starts with:", user.passwordHash.substring(0, 20));
  console.log("Hash length:", user.passwordHash.length);

  const valid = await compare("Demo@1234", user.passwordHash);
  console.log("Password match:", valid);

  process.exit(valid ? 0 : 1);
}

test().catch((e) => { console.error(e); process.exit(1); });
