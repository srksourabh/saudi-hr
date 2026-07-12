import { z } from "zod";

export const goalTypeEnum = z.enum(["okr", "kpi", "project", "development", "behavioral"]);
export const goalStatusEnum = z.enum(["draft", "active", "on_track", "at_risk", "off_track", "completed", "cancelled"]);
export const reviewCycleStatusEnum = z.enum(["planned", "open", "self_review", "manager_review", "calibration", "completed", "archived"]);
export const reviewStatusEnum = z.enum(["pending", "in_progress", "submitted", "acknowledged", "completed"]);
export const reviewTypeEnum = z.enum(["annual", "mid_year", "probation", "project", "360"]);
export const skillCategoryEnum = z.enum(["technical", "soft", "leadership", "domain", "language", "certification"]);
export const proficiencyLevelEnum = z.enum(["beginner", "intermediate", "advanced", "expert"]);
export const learningTypeEnum = z.enum(["course", "workshop", "certification", "mentoring", "coaching", "on_the_job", "conference", "webinar", "self_study"]);
export const learningStatusEnum = z.enum(["planned", "enrolled", "in_progress", "completed", "cancelled", "expired"]);
export const careerPathStatusEnum = z.enum(["active", "paused", "completed", "archived"]);
export const successionStatusEnum = z.enum(["identified", "developing", "ready", "promoted", "departed"]);
export const engagementSurveyStatusEnum = z.enum(["draft", "scheduled", "open", "closed", "analyzed", "action_planning", "completed"]);
export const stayInterviewStatusEnum = z.enum(["scheduled", "completed", "action_required", "closed"]);
export const recognitionTypeEnum = z.enum(["peer", "manager", "company", "anniversary", "achievement", "innovation", "values", "wellness"]);
export const rewardTypeEnum = z.enum(["monetary", "non_monetary", "time_off", "gift", "experience", "development", "public_recognition"]);

export const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const idSchema = z.string().uuid();

export const createGoalSchema = z.object({
  employeeId: z.string().uuid(),
  managerId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: goalTypeEnum,
  status: goalStatusEnum,
  weight: z.number().min(0).max(100).optional(),
  startDate: z.string(),
  endDate: z.string(),
  progress: z.number().min(0).max(100),
  metrics: z.any().optional(),
  parentGoalId: z.string().uuid().optional(),
  reviewCycleId: z.string().uuid().optional(),
});

export const updateGoalSchema = createGoalSchema.partial();

export const goalQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  status: goalStatusEnum.optional(),
  type: goalTypeEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createGoalKeyResultSchema = z.object({
  goalId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
  weight: z.number().min(0).max(100).optional(),
});

export const updateGoalKeyResultSchema = createGoalKeyResultSchema.partial();

export const createReviewCycleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: reviewTypeEnum,
  status: reviewCycleStatusEnum,
  startDate: z.string(),
  endDate: z.string(),
  selfReviewStartDate: z.string().optional(),
  selfReviewEndDate: z.string().optional(),
  managerReviewStartDate: z.string().optional(),
  managerReviewEndDate: z.string().optional(),
  calibrationStartDate: z.string().optional(),
  calibrationEndDate: z.string().optional(),
});

export const updateReviewCycleSchema = createReviewCycleSchema.partial();

export const reviewCycleQuerySchema = z.object({
  status: reviewCycleStatusEnum.optional(),
  type: reviewTypeEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createReviewSchema = z.object({
  reviewCycleId: z.string().uuid(),
  employeeId: z.string().uuid(),
  managerId: z.string().uuid().optional(),
  type: reviewTypeEnum,
  status: reviewStatusEnum,
});

export const updateReviewSchema = createReviewSchema.partial().extend({
  finalRating: z.number().optional(),
  calibrationNotes: z.string().optional(),
});

export const reviewQuerySchema = z.object({
  reviewCycleId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  status: reviewStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createReviewSectionSchema = z.object({
  reviewCycleId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number(),
  weight: z.number(),
  isRequired: z.boolean(),
});

export const updateReviewSectionSchema = createReviewSectionSchema.partial();

export const createReviewResponseSchema = z.object({
  reviewId: z.string().uuid(),
  sectionId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  responses: z.any().optional(),
  rating: z.number().min(1).max(5).optional(),
});

export const updateReviewResponseSchema = createReviewResponseSchema.partial();

export const createSkillSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: skillCategoryEnum,
  isActive: z.boolean(),
});

export const updateSkillSchema = createSkillSchema.partial();

export const skillQuerySchema = z.object({
  category: skillCategoryEnum.optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createEmployeeSkillSchema = z.object({
  employeeId: z.string().uuid(),
  skillId: z.string().uuid(),
  proficiencyLevel: proficiencyLevelEnum,
  yearsExperience: z.number().optional(),
  lastUsed: z.string().optional(),
  isPrimary: z.boolean(),
  verifiedById: z.string().uuid().optional(),
});

export const updateEmployeeSkillSchema = createEmployeeSkillSchema.partial();

export const employeeSkillQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  skillId: z.string().uuid().optional(),
  proficiencyLevel: proficiencyLevelEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createSkillGapSchema = z.object({
  employeeId: z.string().uuid(),
  skillId: z.string().uuid(),
  requiredLevel: proficiencyLevelEnum,
  currentLevel: proficiencyLevelEnum,
  gapReason: z.string().optional(),
  targetDate: z.string().optional(),
});

export const updateSkillGapSchema = createSkillGapSchema.partial();

export const createLearningProgramSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: learningTypeEnum,
  provider: z.string().optional(),
  url: z.string().optional(),
  durationHours: z.number().optional(),
  cost: z.number().optional(),
  currency: z.string().default("SAR"),
  skills: z.array(z.string().uuid()).optional(),
  prerequisites: z.array(z.string().uuid()).optional(),
  isActive: z.boolean(),
  maxParticipants: z.number().optional(),
});

export const updateLearningProgramSchema = createLearningProgramSchema.partial();

export const learningProgramQuerySchema = z.object({
  type: learningTypeEnum.optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createLearningEnrollmentSchema = z.object({
  employeeId: z.string().uuid(),
  programId: z.string().uuid(),
  status: learningStatusEnum,
  dueDate: z.string().optional(),
  approvedById: z.string().uuid().optional(),
});

export const updateLearningEnrollmentSchema = createLearningEnrollmentSchema.partial().extend({
  score: z.number().optional(),
  certificateUrl: z.string().optional(),
  feedback: z.string().optional(),
  progress: z.number().optional(),
});

export const learningEnrollmentQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  programId: z.string().uuid().optional(),
  status: learningStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createCareerRoleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  level: z.number(),
  minSalary: z.number().optional(),
  maxSalary: z.number().optional(),
  currency: z.string().default("SAR"),
  requiredSkills: z.array(z.string().uuid()).optional(),
  competencies: z.any().optional(),
  isActive: z.boolean(),
});

export const updateCareerRoleSchema = createCareerRoleSchema.partial();

export const careerRoleQuerySchema = z.object({
  departmentId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createCareerPathSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  fromRoleId: z.string().uuid().optional(),
  toRoleId: z.string().uuid(),
  status: careerPathStatusEnum,
  estimatedMonths: z.number().optional(),
  requiredSkills: z.array(z.string().uuid()).optional(),
  milestones: z.any().optional(),
});

export const updateCareerPathSchema = createCareerPathSchema.partial();

export const createEmployeeCareerPathSchema = z.object({
  employeeId: z.string().uuid(),
  careerPathId: z.string().uuid(),
  status: careerPathStatusEnum,
  targetCompletionDate: z.string().optional(),
  notes: z.string().optional(),
});

export const updateEmployeeCareerPathSchema = createEmployeeCareerPathSchema.partial();

export const createSuccessionPlanSchema = z.object({
  roleId: z.string().uuid(),
  departmentId: z.string().uuid().optional(),
  incumbentId: z.string().uuid().optional(),
  status: successionStatusEnum,
  riskLevel: z.string().optional(),
  readinessDate: z.string().optional(),
});

export const updateSuccessionPlanSchema = createSuccessionPlanSchema.partial();

export const createSuccessionCandidateSchema = z.object({
  successionPlanId: z.string().uuid(),
  employeeId: z.string().uuid(),
  status: successionStatusEnum,
  readinessScore: z.number().min(0).max(100).optional(),
  nominatedById: z.string().uuid().optional(),
});

export const updateSuccessionCandidateSchema = createSuccessionCandidateSchema.partial();

export const createEngagementSurveySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: engagementSurveyStatusEnum,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  questions: z.any().optional(),
  targetAudience: z.any().optional(),
  isAnonymous: z.boolean(),
});

export const updateEngagementSurveySchema = createEngagementSurveySchema.partial();

export const engagementSurveyQuerySchema = z.object({
  status: engagementSurveyStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createSurveyResponseSchema = z.object({
  surveyId: z.string().uuid(),
  employeeId: z.string().uuid().optional(),
  responses: z.any().optional(),
});

export const updateSurveyResponseSchema = createSurveyResponseSchema.partial();

export const createStayInterviewSchema = z.object({
  employeeId: z.string().uuid(),
  interviewerId: z.string().uuid().optional(),
  scheduledAt: z.string().optional(),
  status: stayInterviewStatusEnum,
  followUpDate: z.string().optional(),
});

export const updateStayInterviewSchema = createStayInterviewSchema.partial().extend({
  responses: z.any().optional(),
  riskFactors: z.any().optional(),
  actionItems: z.any().optional(),
});

export const createRecognitionSchema = z.object({
  fromEmployeeId: z.string().uuid(),
  toEmployeeId: z.string().uuid(),
  type: recognitionTypeEnum,
  message: z.string().min(1),
  values: z.array(z.string()).optional(),
  isPublic: z.boolean(),
  rewardId: z.string().uuid().optional(),
});

export const rewardQuerySchema = z.object({
  type: rewardTypeEnum.optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createRewardSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: rewardTypeEnum,
  value: z.number().optional(),
  currency: z.string().default("SAR"),
  quantity: z.number(),
  isActive: z.boolean(),
});

export const updateRewardSchema = createRewardSchema.partial();

export const createRewardRedemptionSchema = z.object({
  rewardId: z.string().uuid(),
  employeeId: z.string().uuid(),
  approvedById: z.string().uuid().optional(),
});

export const createTotalRewardsStatementSchema = z.object({
  employeeId: z.string().uuid(),
  periodStart: z.string(),
  periodEnd: z.string(),
  baseSalary: z.number().optional(),
  housingAllowance: z.number().optional(),
  transportAllowance: z.number().optional(),
  otherAllowances: z.number().optional(),
  bonus: z.number().optional(),
  benefitsValue: z.number().optional(),
  equityValue: z.number().optional(),
  currency: z.string().default("SAR"),
});

export const totalRewardsQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createCompensationPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string().min(1),
  effectiveDate: z.string(),
  endDate: z.string().optional(),
  eligibilityCriteria: z.any().optional(),
  budget: z.number().optional(),
  currency: z.string().default("SAR"),
  status: z.string().optional(),
});

export const updateCompensationPlanSchema = createCompensationPlanSchema.partial();

export const createCompensationAdjustmentSchema = z.object({
  planId: z.string().uuid(),
  employeeId: z.string().uuid(),
  adjustmentType: z.string().min(1),
  currentValue: z.number().optional(),
  proposedValue: z.number().optional(),
  justification: z.string().optional(),
  status: z.string().optional(),
  approvedById: z.string().uuid().optional(),
  effectiveDate: z.string().optional(),
});

export const updateCompensationAdjustmentSchema = createCompensationAdjustmentSchema.partial();

export const compensationAdjustmentQuerySchema = z.object({
  planId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const createTalentReviewSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  reviewDate: z.string(),
  status: z.string().optional(),
  facilitatorId: z.string().uuid().optional(),
});

export const updateTalentReviewSchema = createTalentReviewSchema.partial();

export const createTalentReviewParticipantSchema = z.object({
  talentReviewId: z.string().uuid(),
  employeeId: z.string().uuid(),
  reviewerId: z.string().uuid().optional(),
  performanceRating: z.number().min(1).max(5).optional(),
  potentialRating: z.number().min(1).max(5).optional(),
  nineBoxPosition: z.string().optional(),
  strengths: z.string().optional(),
  developmentAreas: z.string().optional(),
  nextSteps: z.string().optional(),
  isHighPotential: z.boolean(),
  retentionRisk: z.string().optional(),
});

export const updateTalentReviewParticipantSchema = createTalentReviewParticipantSchema.partial();
