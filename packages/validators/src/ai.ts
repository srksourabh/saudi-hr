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
  model: z.string().min(1).default("claude-3.5-sonnet"),
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
