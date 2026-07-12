/**
 * Provider-agnostic LLM abstraction.
 *
 * The PRD (Section 4) lists Claude API as the documented default AI/ML
 * choice. In practice the platform is built to be provider-agnostic so
 * alternative providers (Gemini 3.5 Flash, others) can be swapped in
 * via the LLM_PROVIDER env var without code changes elsewhere.
 *
 * Two implementation paths live in src/providers/ — one for each
 * supported provider. Selecting the provider happens once at boot via
 * {@link getLlmClient}.
 */

export type LlmProvider = "claude" | "gemini";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmCompletionRequest {
  /** The system prompt, if any. */
  system?: string;
  /** Conversation messages (excluding the system prompt). */
  messages: LlmMessage[];
  /** Maximum tokens to generate. PRD Section 6.4 caps this at 4,000. */
  maxTokens?: number;
  /** Sampling temperature. Defaults to 0.2 for deterministic HR work. */
  temperature?: number;
  /**
   * Optional model override. If omitted, the provider's default model is
   * used (e.g. claude-3-5-sonnet-latest for Anthropic,
   * gemini-3.5-flash-latest for Gemini).
   */
  model?: string;
}

export interface LlmCompletionResponse {
  text: string;
  /** Which model actually produced the response. */
  model: string;
  /** Provider name for logging / audit (PRD 6.5 audit trail). */
  provider: LlmProvider;
  /** Token usage if reported by the provider. */
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
  /** Wall-clock duration in milliseconds. */
  durationMs: number;
}

export interface LlmClient {
  readonly provider: LlmProvider;
  /**
   * Send a completion request. Implementations must:
   * - Enforce the token cap from {@link LlmCompletionRequest.maxTokens}
   *   (or the PRD 6.4 default of 4,000)
   * - Surface provider errors as thrown errors (the caller decides retry
   *   policy, e.g. Agent fallback per PRD 7.3)
   * - Never include PII unless the caller has explicitly approved it
   *   (PRD 6.5 privacy controls)
   */
  complete(req: LlmCompletionRequest): Promise<LlmCompletionResponse>;
}

export class LlmError extends Error {
  constructor(
    public readonly provider: LlmProvider,
    public readonly statusCode: number | undefined,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(`[${provider}] ${message}`);
    this.name = "LlmError";
  }
}
