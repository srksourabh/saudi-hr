/**
 * One-off backfill: encrypt any pre-existing plaintext PII (SEC-008).
 *
 * The `iqama_number_enc` / `passport_number_enc` / `bank_iban_enc` columns are
 * now encrypted transparently on write. Rows written before this change still
 * hold plaintext. This script walks every tenant schema and rewrites those rows
 * through the Drizzle codec, which decrypts-on-read (plaintext passes through
 * unchanged) and encrypts-on-write. It is idempotent: already-encrypted rows
 * decrypt then re-encrypt to the same deterministic ciphertext.
 *
 * Run once per environment after deploy:
 *   FIELD_ENCRYPTION_KEY=... pnpm tsx scripts/encrypt-pii-backfill.ts
 */
import { adminDb, getTenantDb, schema } from "@hrms-app/db";
import { eq } from "drizzle-orm";

async function main() {
  const allTenants = await adminDb.query.tenants.findMany({ columns: { schemaName: true, companyName: true } });
  console.log(`Backfilling PII encryption across ${allTenants.length} tenant(s)...`);

  let total = 0;
  for (const t of allTenants) {
    const db = getTenantDb(t.schemaName);
    const rows = await db
      .select({
        id: schema.tenant.employees.id,
        iqamaNumberEnc: schema.tenant.employees.iqamaNumberEnc,
        passportNumberEnc: schema.tenant.employees.passportNumberEnc,
        bankIbanEnc: schema.tenant.employees.bankIbanEnc,
      })
      .from(schema.tenant.employees);

    for (const row of rows) {
      // Reads already returned decrypted plaintext (or legacy plaintext). Writing
      // it straight back re-encrypts via the codec.
      await db
        .update(schema.tenant.employees)
        .set({
          iqamaNumberEnc: row.iqamaNumberEnc ?? null,
          passportNumberEnc: row.passportNumberEnc ?? null,
          bankIbanEnc: row.bankIbanEnc ?? null,
        })
        .where(eq(schema.tenant.employees.id, row.id));
      total += 1;
    }
    console.log(`  ${t.companyName} (${t.schemaName}): ${rows.length} employee row(s)`);
  }
  console.log(`Done. Re-encrypted ${total} employee row(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
