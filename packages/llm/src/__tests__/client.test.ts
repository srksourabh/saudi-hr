import { describe, it, expect } from "vitest";
import { getLlmClient, _resetLlmClientCacheForTests } from "../index";
import { LlmError } from "../types";

describe("@hrms-app/llm", () => {
  describe("provider selection", () => {
    it("defaults to claude when no provider specified", () => {
      _resetLlmClientCacheForTests();
      delete process.env.LLM_PROVIDER;
      const client = getLlmClient();
      expect(client.provider).toBe("claude");
    });

    it("uses gemini when LLM_PROVIDER=gemini", () => {
      _resetLlmClientCacheForTests();
      process.env.LLM_PROVIDER = "gemini";
      try {
        const client = getLlmClient();
        expect(client.provider).toBe("gemini");
      } finally {
        delete process.env.LLM_PROVIDER;
      }
    });

    it("explicit config.provider overrides env var", () => {
      _resetLlmClientCacheForTests();
      process.env.LLM_PROVIDER = "gemini";
      try {
        const client = getLlmClient({ provider: "claude" });
        expect(client.provider).toBe("claude");
      } finally {
        delete process.env.LLM_PROVIDER;
      }
    });
  });

  describe("missing API key", () => {
    it("claude provider throws LlmError when ANTHROPIC_API_KEY is unset and complete() is called", async () => {
      _resetLlmClientCacheForTests();
      const saved = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      try {
        const client = getLlmClient({ provider: "claude" });
        // Construction is lazy; the throw fires on the first call.
        await expect(client.complete({ messages: [] })).rejects.toBeInstanceOf(LlmError);
      } finally {
        if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
        _resetLlmClientCacheForTests();
      }
    });

    it("gemini provider throws LlmError when GEMINI_API_KEY is unset and complete() is called", async () => {
      _resetLlmClientCacheForTests();
      const saved = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      try {
        const client = getLlmClient({ provider: "gemini" });
        await expect(client.complete({ messages: [] })).rejects.toBeInstanceOf(LlmError);
      } finally {
        if (saved !== undefined) process.env.GEMINI_API_KEY = saved;
        _resetLlmClientCacheForTests();
      }
    });
  });

  describe("LlmError shape", () => {
    it("carries provider and statusCode", () => {
      const err = new LlmError("gemini", 429, "rate limited");
      expect(err.provider).toBe("gemini");
      expect(err.statusCode).toBe(429);
      expect(err.message).toContain("gemini");
      expect(err.message).toContain("rate limited");
      expect(err.name).toBe("LlmError");
    });
  });
});
