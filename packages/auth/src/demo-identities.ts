export interface DemoIdentity {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "hr_manager" | "hr_specialist" | "department_manager" | "employee";
  employeeId: string;
  /** Links to public.tenants.id — Rukn Energy Services */
  tenantId: string;
  image: string;
  preferredLanguage: "en" | "ar";
}

/** Rukn Energy Services tenant ID (must match public.tenants.id + seed data) */
export const RUKN_TENANT_ID = "1ed8b6bd-3743-5000-8000-000000000001";

export const demoIdentities = {
  admin: {
    id: "demo-admin",
    email: "admin@taazur.example",
    password: "TaazurDemo@2026",
    name: "Reem Al-Harbi",
    role: "hr_manager",
    employeeId: "e0800b36-5b73-5000-8000-000000000001",
    tenantId: RUKN_TENANT_ID,
    image: "",
    preferredLanguage: "en",
  },
  hrSpecialist: {
    id: "demo-hr-specialist",
    email: "specialist@taazur.example",
    password: "TaazurDemo@2026",
    name: "Aisha Al-Otaibi",
    role: "hr_specialist",
    employeeId: "e0800b36-5b73-5000-8000-000000000003",
    tenantId: RUKN_TENANT_ID,
    image: "",
    preferredLanguage: "en",
  },
  departmentManager: {
    id: "demo-department-manager",
    email: "manager@taazur.example",
    password: "TaazurDemo@2026",
    name: "Fahad Al-Qahtani",
    role: "department_manager",
    employeeId: "e0800b36-5b73-5000-8000-000000000002",
    tenantId: RUKN_TENANT_ID,
    image: "",
    preferredLanguage: "en",
  },
  employee: {
    id: "demo-employee",
    email: "employee@taazur.example",
    password: "TaazurDemo@2026",
    name: "Omar Nasser Al-Dossary",
    role: "employee",
    employeeId: "e0800b36-5b73-5000-8000-000000000009",
    tenantId: RUKN_TENANT_ID,
    image: "",
    preferredLanguage: "en",
  },
} as const satisfies Record<string, DemoIdentity>;

export type DemoIdentityKey = keyof typeof demoIdentities;

export function resolveDemoIdentity(
  email: string,
  password: string,
  demoModeEnabled = false,
): DemoIdentity | null {
  if (!demoModeEnabled) return null;
  return (
    Object.values(demoIdentities).find(
      (identity) => identity.email === email && identity.password === password,
    ) ?? null
  );
}
