/**
 * Create one clean login per role for the Rukn Energy demo tenant.
 * Idempotent: upserts on email. Run with:
 *   NODE_PATH=apps/web/node_modules ./packages/db/node_modules/.bin/tsx --env-file=.env scripts/create-demo-role-logins.ts
 */
import { adminDb, users } from "@hrms-app/db";
import { hash } from "bcryptjs";

const RUKN_TENANT_ID = "1ed8b6bd-3743-5000-8000-000000000001";
const PASSWORD = "RuknDemo@2026";

// employeeId values are real rows in schema tenant_1ed8b6bd3743 (from inspection).
const LOGINS = [
  { email: "superadmin@rukn-energy.example",   role: "super_admin",        name: "Demo Super Admin",   employeeId: "70c6e56a-6f3c-57e1-88e8-b6aa81f44941" }, // Reem Al-Harbi
  { email: "hrmanager@rukn-energy.example",     role: "hr_manager",         name: "Demo HR Manager",    employeeId: "70c6e56a-6f3c-57e1-88e8-b6aa81f44941" }, // Reem Al-Harbi
  { email: "hrspecialist@rukn-energy.example",  role: "hr_specialist",      name: "Demo HR Specialist", employeeId: "ea1c81d1-7231-52de-8c35-feb24ba88fd5" }, // Aisha Al-Otaibi
  { email: "payrolladmin@rukn-energy.example",  role: "payroll_admin",      name: "Demo Payroll Admin", employeeId: "a77dc912-6044-569b-a8f1-026e315ad528" }, // Mariam Al-Dosari
  { email: "deptmanager@rukn-energy.example",   role: "department_manager", name: "Demo Dept Manager",  employeeId: "0c3b4817-a265-5d61-87e9-abcc6518ff4a" }, // Fahad Al-Qahtani
  { email: "recruiter@rukn-energy.example",     role: "recruiter",          name: "Demo Recruiter",     employeeId: "39af44f9-d177-54f5-8865-c8657c1d5d87" }, // Noura Al-Subaie
  { email: "employee@rukn-energy.example",      role: "employee",           name: "Demo Employee",      employeeId: "41f58f2a-f94f-5bf3-8b05-76aaf4b89190" }, // Omar Al-Dossary
  { email: "candidate@rukn-energy.example",     role: "candidate",          name: "Demo Candidate",     employeeId: null }, // external applicant view
] as const;

async function main() {
  const passwordHash = await hash(PASSWORD, 12);
  for (const l of LOGINS) {
    await adminDb
      .insert(users)
      .values({
        tenantId: RUKN_TENANT_ID,
        email: l.email,
        passwordHash,
        name: l.name,
        role: l.role,
        preferredLanguage: "en",
        employeeId: l.employeeId,
        emailVerified: new Date(),
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          passwordHash,
          role: l.role,
          name: l.name,
          employeeId: l.employeeId,
          tenantId: RUKN_TENANT_ID,
        },
      });
    console.log(`upserted  ${l.role.padEnd(18)} ${l.email}`);
  }
  console.log(`\nDone. ${LOGINS.length} role logins ready. Shared password: ${PASSWORD}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
