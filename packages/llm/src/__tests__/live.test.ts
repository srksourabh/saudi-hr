/**
 * Sanity test for the @hrms-app/llm provider-agnostic abstraction.
 *
 * If GEMINI_API_KEY (or ANTHROPIC_API_KEY) is set in the environment,
 * this test makes one real completion call against the active provider
 * to prove the abstraction works end-to-end. It is skipped when no
 * key is configured, so it is safe in CI.
 *
 * Why this exists: the @hrms-app/llm package was built with mocked
 * tests. Before declaring the abstraction "done" against a real
 * provider, we want a single integration smoke test that would catch
 * a wiring regression (e.g. wrong URL, wrong header, wrong model
 * name). Catching those at test time is far cheaper than at
 * production time.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getLlmClient, _resetLlmClientCacheForTests } from "../index";

loadLocalEnv();

const HAS_GEMINI = !!process.env.GEMINI_API_KEY;
const HAS_ANTHROPIC = !!process.env.ANTHROPIC_API_KEY;
const HAS_ANY_KEY = HAS_GEMINI || HAS_ANTHROPIC;
const runIf = HAS_ANY_KEY ? describe : describe.skip;

function loadLocalEnv(): void {
  const candidates = [
    join(process.cwd(), ".env.local"),
    join(process.cwd(), ".env"),
  ];

  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const content = readFileSync(file, "utf-8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      if (!key || process.env[key]) continue;
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

runIf("@hrms-app/llm live smoke test", () => {
  it("completes a real prompt through the active provider", async () => {
    _resetLlmClientCacheForTests();
    const client = getLlmClient();
    const r = await client.complete({
      system: "You are a helpful assistant. Reply in one short sentence.",
      messages: [
        { role: "user", content: "What is 2 + 2?" },
      ],
      maxTokens: 512,
      temperature: 0,
    });

    expect(r.provider).toMatch(/^(claude|gemini)$/);
    expect(typeof r.text).toBe("string");
    expect(r.text.length).toBeGreaterThan(0);
    // The model should identify 4 somewhere in the answer (numeric or word form).
    expect(r.text.toLowerCase()).toMatch(/\b(4|four)\b/);
    // Latency should be reported and reasonable (< 60s).
    expect(r.durationMs).toBeGreaterThan(0);
    expect(r.durationMs).toBeLessThan(60_000);
  }, 60_000);
});
