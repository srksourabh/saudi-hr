import type {
  LlmClient,
  LlmCompletionRequest,
  LlmCompletionResponse,
  LlmProvider,
} from "../types";
import { LlmError } from "../types";

/**
 * Google Gemini provider.
 *
 * Default model: gemini-3.5-flash (per user direction, 2026-07-12,
 * as the active LLM provider — replaces Claude in the runtime config while
 * keeping the package provider-agnostic). Google currently exposes this
 * model as `models/gemini-3.5-flash` via the v1beta generateContent API.
 *
 * Gemini's REST API is invoked directly via fetch (no SDK dependency) to
 * keep the package minimal. API reference:
 * https://ai.google.dev/api/generate-content
 */
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-3.5-flash";
const DEFAULT_MAX_TOKENS = 4000; // PRD Section 6.4 cap

export interface GeminiClientConfig {
  apiKey: string;
  /** Override the default model. Most callers leave this alone. */
  defaultModel?: string;
}

export function createGeminiClient(config: GeminiClientConfig): LlmClient {
  const provider: LlmProvider = "gemini";
  const defaultModel = config.defaultModel ?? DEFAULT_MODEL;

  if (!config.apiKey) {
    throw new LlmError(provider, undefined, "GEMINI_API_KEY is not set");
  }

  return {
    provider,
    async complete(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
      const start = Date.now();
      const model = req.model ?? defaultModel;
      const maxTokens = req.maxTokens ?? DEFAULT_MAX_TOKENS;
      const temperature = req.temperature ?? 0.2;

      // Gemini merges the system prompt into a `systemInstruction` field
      // and turns conversation messages into `contents` entries with the
      // `role` mapped to "user" / "model".
      const systemInstruction = req.system
        ? { parts: [{ text: req.system }] }
        : undefined;
      const contents = req.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const url = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction,
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature,
            },
          }),
        });
      } catch (err) {
        throw new LlmError(provider, undefined, "Network error", err);
      }

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new LlmError(
          provider,
          response.status,
          `HTTP ${response.status}: ${body || response.statusText}`,
        );
      }

      const data = (await response.json()) as {
        modelVersion?: string;
        candidates?: {
          content?: { parts?: { text?: string }[] };
        }[];
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
        };
      };

      const text =
        data.candidates
          ?.flatMap((c) => c.content?.parts ?? [])
          .map((p) => p.text ?? "")
          .join("") ?? "";

      return {
        text,
        model: data.modelVersion ?? model,
        provider,
        usage: data.usageMetadata
          ? {
              inputTokens: data.usageMetadata.promptTokenCount,
              outputTokens: data.usageMetadata.candidatesTokenCount,
            }
          : undefined,
        durationMs: Date.now() - start,
      };
    },
  };
}
