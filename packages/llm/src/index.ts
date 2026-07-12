export * from "./types";
export { createClaudeClient, type ClaudeClientConfig } from "./providers/claude";
export { createGeminiClient, type GeminiClientConfig } from "./providers/gemini";

import type { LlmClient, LlmCompletionRequest, LlmCompletionResponse, LlmProvider } from "./types";
import { LlmError } from "./types";
import { createClaudeClient, type ClaudeClientConfig } from "./providers/claude";
import { createGeminiClient, type GeminiClientConfig } from "./providers/gemini";

export interface LlmConfig {
  /** Provider name; defaults to "claude" per PRD Section 4. */
  provider?: LlmProvider;
  /** Anthropic API key. Required when provider is "claude". */
  anthropicApiKey?: string;
  /** Google Gemini API key. Required when provider is "gemini". */
  geminiApiKey?: string;
  /** Optional default model override (per provider). */
  defaultModel?: string;
}

interface CachedEntry {
  client: LlmClient | null;
  /** Last error from a failed construction, replayed on each access until reset. */
  constructionError: LlmError | null;
  cacheKey: string;
}

let cache: CachedEntry | null = null;

/**
 * Resolve the active LLM client. Reads from LlmConfig first, then falls
 * back to environment variables. Result is cached per (config) so the
 * same client is reused across calls.
 *
 * Construction of the underlying provider is **lazy**: the client is
 * only built on the first call to `.complete()`. This lets the
 * platform boot even when no API key is configured yet (e.g. during
 * local dev of unrelated features), and means missing-key errors fire
 * at the call site, not at startup.
 *
 * Selection order:
 *   1. Explicit `config.provider` if provided
 *   2. LLM_PROVIDER env var ("claude" | "gemini")
 *   3. Default to "claude" (per PRD Section 4)
 *
 * API key selection:
 *   - claude: ANTHROPIC_API_KEY (or config.anthropicApiKey)
 *   - gemini: GEMINI_API_KEY (or config.geminiApiKey)
 */
export function getLlmClient(config?: LlmConfig): LlmClient {
  const provider: LlmProvider =
    config?.provider ??
    (process.env.LLM_PROVIDER as LlmProvider | undefined) ??
    "claude";

  const cacheKey = JSON.stringify({
    provider,
    anthropicKey: config?.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY ?? "",
    geminiKey: config?.geminiApiKey ?? process.env.GEMINI_API_KEY ?? "",
    model: config?.defaultModel ?? "",
  });

  if (cache && cache.cacheKey === cacheKey) {
    return makeProxy(provider, cache);
  }

  cache = { client: null, constructionError: null, cacheKey };
  return makeProxy(provider, cache);
}

function makeProxy(provider: LlmProvider, entry: CachedEntry): LlmClient {
  const construct = (): LlmClient => {
    if (entry.client) return entry.client;
    if (entry.constructionError) throw entry.constructionError;
    try {
      if (provider === "gemini") {
        const geminiConfig: GeminiClientConfig = {
          apiKey: process.env.GEMINI_API_KEY ?? "",
        };
        entry.client = createGeminiClient(geminiConfig);
      } else {
        const claudeConfig: ClaudeClientConfig = {
          apiKey: process.env.ANTHROPIC_API_KEY ?? "",
        };
        entry.client = createClaudeClient(claudeConfig);
      }
      return entry.client;
    } catch (err) {
      if (err instanceof LlmError) {
        entry.constructionError = err;
        throw err;
      }
      const wrapped = new LlmError(provider, undefined, "Provider construction failed", err);
      entry.constructionError = wrapped;
      throw wrapped;
    }
  };

  return {
    provider,
    async complete(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
      const client = construct();
      return client.complete(req);
    },
  };
}

/** Test helper: clear the cached client. */
export function _resetLlmClientCacheForTests(): void {
  cache = null;
}

