import type {
  LlmClient,
  LlmCompletionRequest,
  LlmCompletionResponse,
  LlmProvider,
} from "../types";
import { LlmError } from "../types";

/**
 * Anthropic Claude provider.
 *
 * Default model: claude-3-5-sonnet-latest (per PRD Section 4).
 * The PRD also notes Claude Haiku for classification / extraction and
 * Claude Sonnet for insights / copilot. The model's `model` field can
 * be overridden per-request via {@link LlmCompletionRequest.model}.
 *
 * The Anthropic API is invoked directly via fetch (no SDK dependency)
 * to keep the package minimal. API reference:
 * https://docs.anthropic.com/en/api/messages
 */
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-3-5-sonnet-latest";
const DEFAULT_MAX_TOKENS = 4000; // PRD Section 6.4 cap

export interface ClaudeClientConfig {
  apiKey: string;
  /** Override the default model. Most callers leave this alone. */
  defaultModel?: string;
}

export function createClaudeClient(config: ClaudeClientConfig): LlmClient {
  const provider: LlmProvider = "claude";
  const defaultModel = config.defaultModel ?? DEFAULT_MODEL;

  if (!config.apiKey) {
    throw new LlmError(provider, undefined, "ANTHROPIC_API_KEY is not set");
  }

  return {
    provider,
    async complete(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
      const start = Date.now();
      const model = req.model ?? defaultModel;
      const maxTokens = req.maxTokens ?? DEFAULT_MAX_TOKENS;
      const temperature = req.temperature ?? 0.2;

      // Anthropic expects the system prompt as a top-level field, not as
      // a message in the messages array.
      const messages = req.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      let response: Response;
      try {
        response = await fetch(ANTHROPIC_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": config.apiKey,
            "anthropic-version": ANTHROPIC_API_VERSION,
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            temperature,
            system: req.system,
            messages,
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
        model: string;
        content: { type: string; text?: string }[];
        usage?: { input_tokens?: number; output_tokens?: number };
      };

      const text = data.content
        .filter((c) => c.type === "text" && typeof c.text === "string")
        .map((c) => c.text)
        .join("");

      return {
        text,
        model: data.model,
        provider,
        usage: data.usage
          ? {
              inputTokens: data.usage.input_tokens,
              outputTokens: data.usage.output_tokens,
            }
          : undefined,
        durationMs: Date.now() - start,
      };
    },
  };
}
