import { z } from "zod";
import { paginationSchema } from "./common";

export const aiSuggestionTypeEnum = z.enum([
  "salary_benchmark", "skill_recommendation", "churn_prediction",
  "compliance_risk", "candidate_match", "interview_feedback",
  "jd_enhancement", "survey_sentiment", "career_path", "learning_recommendation",
  "compensation_insight", "retention_risk", "general",
]);
export const aiSuggestionStatusEnum = z.enum(["pending", "applied", "dismissed", "in_progress"]);
export const aiConfidenceLevelEnum = z.enum(["low", "medium", "high", "very_high"]);

export const aiAssistantSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  // Model is now required and must be a concrete model string (e.g.
  // "claude-3-5-sonnet-latest", "gemini-3.5-flash-latest"). The set of
  // valid models is enforced at the application layer via packages/llm;
  // this schema intentionally stays permissive to keep it in sync with
  // any new provider added later.
  model: z.string().min(1),
  systemPrompt: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  config: z.record(z.unknown()).optional(),
});

export const aiAssistantUpdateSchema = aiAssistantSchema.partial();

export const aiSuggestionSchema = z.object({
  employeeId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  type: aiSuggestionTypeEnum,
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  suggestion: z.record(z.unknown()),
  reasoning: z.string().optional(),
  confidence: aiConfidenceLevelEnum.default("medium"),
  source: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const aiSuggestionUpdateSchema = z.object({
  status: aiSuggestionStatusEnum.optional(),
  appliedAt: z.string().datetime().optional(),
  appliedBy: z.string().uuid().optional(),
});

export const aiSuggestionQuerySchema = paginationSchema.extend({
  type: aiSuggestionTypeEnum.optional(),
  status: aiSuggestionStatusEnum.optional(),
  employeeId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
});

export const aiChurnPredictionQuerySchema = paginationSchema.extend({
  riskLevel: z.string().optional(),
  employeeId: z.string().uuid().optional(),
});

export const aiSkillRecommendationQuerySchema = paginationSchema.extend({
  employeeId: z.string().uuid().optional(),
  priority: aiConfidenceLevelEnum.optional(),
});

export const aiCompliancePredictionQuerySchema = paginationSchema.extend({
  riskType: z.string().optional(),
  riskLevel: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  isResolved: z.boolean().optional(),
});

export const aiSalaryBenchmarkQuerySchema = paginationSchema.extend({
  jobTitle: z.string().optional(),
  region: z.string().optional(),
  industry: z.string().optional(),
});

export const aiAuditLogQuerySchema = paginationSchema.extend({
  action: z.string().optional(),
  entityType: z.string().optional(),
  success: z.boolean().optional(),
});


// ─── AI chat ────────────────────────────────────────────────────────
export const aiChatRoleSchema = z.enum(["user", "assistant", "system"]);
export const aiChatMessageSchema = z.object({
  role: aiChatRoleSchema,
  content: z.string().min(1).max(8000),
});
export const aiChatRequestSchema = z.object({
  messages: z.array(aiChatMessageSchema).min(1).max(20),
  /** Optional context hint to bias the LLM toward a particular topic. */
  topic: z.enum([
    "general",
    "saudi_statutory",
    "leave_policy",
    "payroll",
    "expense_policy",
    "recruitment",
    "onboarding",
    "performance",
  ]).default("general"),
  /** Optional override of the model to use for this turn. */
  model: z.string().min(1).optional(),
  /** Optional temperature override (defaults applied server-side per topic). */
  temperature: z.number().min(0).max(2).optional(),
});
export type AiChatMessage = z.infer<typeof aiChatMessageSchema>;
export type AiChatRequest = z.infer<typeof aiChatRequestSchema>;
