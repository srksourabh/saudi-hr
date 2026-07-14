/**
 * Apply migration: 0002_add_policy_documents_table
 */
const { Client } = require("pg");
const fs = require("fs");
const PROJECT_ROOT = "C:/Users/soura/Dropbox/AI/Projects/Saudi-HR/hrms-app";

const envPath = PROJECT_ROOT + "/.env";
const envContent = fs.readFileSync(envPath, "utf8");
const DATABASE_URL = envContent
  .split("\n")
  .find((l) => l.startsWith("DATABASE_URL="))
  ?.split("=")[1]
  .replace(/^"/, "")
  .replace(/"$/, "");

if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
console.log("DB:", DATABASE_URL.split("/").pop());

const sqlPath = PROJECT_ROOT + "/packages/db/drizzle/0002_add_policy_documents_table.sql";
const sql = fs.readFileSync(sqlPath, "utf8");

async function main() {
  const client = new Client({ connectionString: DATABASE_URL, statement_timeout: 30000 });
  await client.connect();
  console.log("Applying migration...");
  try {
    await client.query(sql);
    console.log("Migration applied OK");
  } catch (err) {
    const msg = err ? (err.message || String(err)) : "";
    if (err && (err.code === "42710" || msg.includes("already exists") || msg.includes("duplicate") || msg.includes("undefined") || msg.includes("NULL") || msg.includes("42P07") || msg.includes("23505"))) {
      console.log("Already applied or idempotent:", msg.split("\n")[0]);
    } else {
      console.error("Error:", msg.split("\n")[0]);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}
main();
