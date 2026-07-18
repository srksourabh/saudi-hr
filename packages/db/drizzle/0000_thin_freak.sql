CREATE TYPE "public"."ai_confidence_level" AS ENUM('low', 'medium', 'high', 'very_high');--> statement-breakpoint
CREATE TYPE "public"."ai_suggestion_status" AS ENUM('pending', 'applied', 'dismissed', 'in_progress');--> statement-breakpoint
CREATE TYPE "public"."ai_suggestion_type" AS ENUM('salary_benchmark', 'skill_recommendation', 'churn_prediction', 'compliance_risk', 'candidate_match', 'interview_feedback', 'jd_enhancement', 'survey_sentiment', 'career_path', 'learning_recommendation', 'compensation_insight', 'retention_risk', 'general');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('applied', 'screening', 'phone_screen', 'technical_interview', 'final_interview', 'offer_extended', 'offer_accepted', 'offer_declined', 'hired', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."background_check_status" AS ENUM('pending', 'in_progress', 'clear', 'flagged', 'failed');--> statement-breakpoint
CREATE TYPE "public"."candidate_source" AS ENUM('job_board', 'referral', 'linkedin', 'career_site', 'agency', 'direct', 'other');--> statement-breakpoint
CREATE TYPE "public"."candidate_status" AS ENUM('new', 'screening', 'interviewing', 'offer', 'hired', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."career_path_status" AS ENUM('active', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."employment_status" AS ENUM('active', 'terminated', 'suspended', 'on_leave');--> statement-breakpoint
CREATE TYPE "public"."engagement_survey_status" AS ENUM('draft', 'scheduled', 'open', 'closed', 'analyzed', 'action_planning', 'completed');--> statement-breakpoint
CREATE TYPE "public"."goal_status" AS ENUM('draft', 'active', 'on_track', 'at_risk', 'off_track', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."goal_type" AS ENUM('okr', 'kpi', 'project', 'development', 'behavioral');--> statement-breakpoint
CREATE TYPE "public"."gosi_system" AS ENUM('old', 'new');--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled');--> statement-breakpoint
CREATE TYPE "public"."interview_type" AS ENUM('phone_screen', 'video', 'in_person', 'technical', 'panel', 'cultural_fit', 'final');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'open', 'paused', 'closed', 'filled', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('full_time', 'part_time', 'contract', 'internship', 'temporary');--> statement-breakpoint
CREATE TYPE "public"."learning_status" AS ENUM('planned', 'enrolled', 'in_progress', 'completed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."learning_type" AS ENUM('course', 'workshop', 'certification', 'mentoring', 'coaching', 'on_the_job', 'conference', 'webinar', 'self_study');--> statement-breakpoint
CREATE TYPE "public"."nationality" AS ENUM('saudi', 'expat', 'gcc');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('draft', 'sent', 'accepted', 'declined', 'expired', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."onboarding_status" AS ENUM('not_started', 'in_progress', 'completed', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."plan_tier" AS ENUM('basic', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."proficiency_level" AS ENUM('beginner', 'intermediate', 'advanced', 'expert');--> statement-breakpoint
CREATE TYPE "public"."qiwa_contract_status" AS ENUM('draft', 'submitted', 'accepted', 'rejected', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."qiwa_contract_type" AS ENUM('permanent', 'contract', 'probation');--> statement-breakpoint
CREATE TYPE "public"."recognition_type" AS ENUM('peer', 'manager', 'company', 'anniversary', 'achievement', 'innovation', 'values', 'wellness');--> statement-breakpoint
CREATE TYPE "public"."reference_check_status" AS ENUM('pending', 'contacted', 'completed', 'positive', 'negative');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('submitted', 'screening', 'interviewed', 'hired', 'rejected', 'reward_paid');--> statement-breakpoint
CREATE TYPE "public"."review_cycle_status" AS ENUM('planned', 'open', 'self_review', 'manager_review', 'calibration', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'in_progress', 'submitted', 'acknowledged', 'completed');--> statement-breakpoint
CREATE TYPE "public"."review_type" AS ENUM('annual', 'mid_year', 'probation', 'project', '360');--> statement-breakpoint
CREATE TYPE "public"."reward_type" AS ENUM('monetary', 'non_monetary', 'time_off', 'gift', 'experience', 'development', 'public_recognition');--> statement-breakpoint
CREATE TYPE "public"."skill_category" AS ENUM('technical', 'soft', 'leadership', 'domain', 'language', 'certification');--> statement-breakpoint
CREATE TYPE "public"."stay_interview_status" AS ENUM('scheduled', 'completed', 'action_required', 'closed');--> statement-breakpoint
CREATE TYPE "public"."succession_status" AS ENUM('identified', 'developing', 'ready', 'promoted', 'departed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'hr_manager', 'department_manager', 'hr_specialist', 'payroll_admin', 'recruiter', 'employee', 'candidate');--> statement-breakpoint
CREATE TYPE "public"."preferred_language" AS ENUM('en', 'ar');--> statement-breakpoint
CREATE TYPE "public"."regulatory_context" AS ENUM('saudi', 'india');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late', 'on_leave', 'remote', 'half_day', 'holiday', 'weekend');--> statement-breakpoint
CREATE TYPE "public"."attendance_exception_status" AS ENUM('open', 'acknowledged', 'resolved', 'waived');--> statement-breakpoint
CREATE TYPE "public"."attendance_exception_type" AS ENUM('missing_punch_in', 'missing_punch_out', 'late_arrival', 'early_departure', 'no_show', 'missed_break', 'location_violation');--> statement-breakpoint
CREATE TYPE "public"."invite_role" AS ENUM('hr_manager', 'department_manager', 'payroll_admin', 'employee');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."immigration_status" AS ENUM('valid', 'expiring_soon', 'expired', 'renewal_pending', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."visa_type" AS ENUM('work', 'visit', 'dependent', 'exit_reentry', 'final_exit');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "ai_assistants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"model" text NOT NULL,
	"system_prompt" text,
	"capabilities" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"prompt_preview" text,
	"response_preview" text,
	"model_used" text,
	"tokens_used" integer,
	"duration_ms" integer,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"performed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_candidate_matchings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid,
	"job_requisition_id" uuid,
	"match_score" numeric(5, 2) NOT NULL,
	"skill_match" jsonb,
	"experience_match" jsonb,
	"education_match" jsonb,
	"culture_fit_score" numeric(5, 2),
	"overall_assessment" text,
	"strengths" jsonb,
	"gaps" jsonb,
	"recommendations" jsonb,
	"model_used" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_churn_predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"risk_score" numeric(5, 2) NOT NULL,
	"risk_level" text NOT NULL,
	"key_factors" jsonb,
	"predicted_timeline" text,
	"retention_strategies" jsonb,
	"model_version" text,
	"prediction_date" date NOT NULL,
	"is_accurate" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_compliance_predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid,
	"employee_id" uuid,
	"risk_type" text NOT NULL,
	"risk_score" numeric(5, 2) NOT NULL,
	"risk_level" text NOT NULL,
	"findings" jsonb,
	"recommendations" jsonb,
	"regulatory_references" jsonb,
	"is_resolved" boolean DEFAULT false,
	"prediction_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_interview_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid,
	"transcript_summary" text,
	"key_topics" jsonb,
	"sentiment_analysis" jsonb,
	"skill_assessment" jsonb,
	"red_flags" jsonb,
	"green_flags" jsonb,
	"overall_rating" integer,
	"hiring_recommendation" text,
	"suggested_questions" jsonb,
	"model_used" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_jd_enhancements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_requisition_id" uuid NOT NULL,
	"original_content" text NOT NULL,
	"enhanced_content" text NOT NULL,
	"changes" jsonb,
	"suggestions" jsonb,
	"model_used" text,
	"is_applied" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_retention_risk_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"flag_type" text NOT NULL,
	"risk_level" text NOT NULL,
	"description" text NOT NULL,
	"indicators" jsonb,
	"suggested_actions" jsonb,
	"is_resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_salary_benchmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_title" text NOT NULL,
	"industry" text,
	"region" text NOT NULL,
	"experience_level" text NOT NULL,
	"p10" numeric(12, 2),
	"p25" numeric(12, 2),
	"p50" numeric(12, 2),
	"p75" numeric(12, 2),
	"p90" numeric(12, 2),
	"currency" text DEFAULT 'SAR',
	"source" text,
	"data_freshness" date,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_skill_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"current_skills" jsonb,
	"target_role" text,
	"recommended_skills" jsonb NOT NULL,
	"learning_path" jsonb,
	"estimated_timeline" text,
	"priority" "ai_confidence_level" DEFAULT 'medium',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid,
	"department_id" uuid,
	"type" "ai_suggestion_type" NOT NULL,
	"status" "ai_suggestion_status" DEFAULT 'pending' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"suggestion" jsonb NOT NULL,
	"reasoning" text,
	"confidence" "ai_confidence_level" DEFAULT 'medium' NOT NULL,
	"source" text,
	"metadata" jsonb,
	"applied_at" timestamp,
	"applied_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_survey_sentiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid,
	"response_id" uuid,
	"overall_sentiment" text NOT NULL,
	"sentiment_score" numeric(5, 2),
	"category_breakdown" jsonb,
	"key_themes" jsonb,
	"action_items" jsonb,
	"employee_group" text,
	"analyzed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_requisition_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"status" "application_status" DEFAULT 'applied' NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"screened_at" timestamp,
	"screened_by_id" uuid,
	"screening_notes" text,
	"current_stage" text DEFAULT 'applied',
	"stage_entered_at" timestamp DEFAULT now(),
	"disqualification_reason" text,
	"referrer_employee_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "background_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"application_id" uuid,
	"status" "background_check_status" DEFAULT 'pending' NOT NULL,
	"provider" text,
	"provider_reference_id" text,
	"checks" jsonb,
	"result" jsonb,
	"initiated_at" timestamp,
	"completed_at" timestamp,
	"cost" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"linkedin_url" text,
	"portfolio_url" text,
	"resume_url" text,
	"resume_text" text,
	"source" text,
	"source_details" jsonb,
	"nationality" text DEFAULT 'saudi',
	"current_location" text,
	"notice_period_days" integer,
	"expected_salary" numeric(12, 2),
	"current_salary" numeric(12, 2),
	"availability_date" date,
	"tags" text[],
	"notes" text,
	"gdpr_consent" boolean DEFAULT false,
	"gdpr_consent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"from_role_id" uuid,
	"to_role_id" uuid NOT NULL,
	"status" "career_path_status" DEFAULT 'active' NOT NULL,
	"estimated_months" integer,
	"required_skills" uuid[],
	"required_experience" jsonb,
	"milestones" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"department_id" uuid,
	"level" integer NOT NULL,
	"min_salary" numeric(12, 2),
	"max_salary" numeric(12, 2),
	"currency" text DEFAULT 'SAR',
	"required_skills" uuid[],
	"required_experience" jsonb,
	"competencies" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compensation_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"adjustment_type" text NOT NULL,
	"current_value" numeric(12, 2),
	"proposed_value" numeric(12, 2),
	"change_amount" numeric(12, 2),
	"change_percentage" numeric(5, 2),
	"justification" text,
	"status" text DEFAULT 'pending',
	"approved_by_id" uuid,
	"approved_at" timestamp,
	"effective_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compensation_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"effective_date" date NOT NULL,
	"end_date" date,
	"eligibility_criteria" jsonb,
	"budget" numeric(14, 2),
	"currency" text DEFAULT 'SAR',
	"status" text DEFAULT 'draft',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_run_id" uuid NOT NULL,
	"check_type" text NOT NULL,
	"status" text NOT NULL,
	"flagged_issues" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"parent_department_id" uuid,
	"head_employee_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"type" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"expiry_date" date,
	"version" text DEFAULT '1' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_career_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"career_path_id" uuid NOT NULL,
	"status" "career_path_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"target_completion_date" date,
	"completed_at" timestamp,
	"current_milestone" integer DEFAULT 0,
	"progress" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"proficiency_level" "proficiency_level" DEFAULT 'beginner' NOT NULL,
	"years_experience" integer,
	"last_used" date,
	"is_primary" boolean DEFAULT false,
	"verified_by_id" uuid,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid,
	"manager_employee_id" uuid,
	"full_name" text NOT NULL,
	"nationality" "nationality" NOT NULL,
	"gcc_status" text DEFAULT 'false',
	"employment_status" "employment_status" DEFAULT 'active' NOT NULL,
	"salary_basic" numeric(12, 2) NOT NULL,
	"salary_housing" numeric(12, 2) DEFAULT '0' NOT NULL,
	"salary_transport" numeric(12, 2) DEFAULT '0' NOT NULL,
	"hire_date" date NOT NULL,
	"termination_date" date,
	"gosi_registration_date" date,
	"gosi_system" "gosi_system",
	"iqama_number_enc" text,
	"passport_number_enc" text,
	"bank_iban_enc" text,
	"passport_expiry" date,
	"iqama_expiry" date,
	"exit_reentry_expiry" date,
	"visa_type" "visa_type",
	"occupation_code" text,
	"skill_level" text,
	"immigration_status" "immigration_status" DEFAULT 'valid',
	"rehire_eligible" text,
	"rehire_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employment_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"effective_date" date NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engagement_surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "engagement_survey_status" DEFAULT 'draft' NOT NULL,
	"start_date" date,
	"end_date" date,
	"questions" jsonb,
	"target_audience" jsonb,
	"is_anonymous" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "final_settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"esb_amount" numeric(12, 2),
	"unpaid_salary" numeric(12, 2),
	"accrued_leave_payout" numeric(12, 2),
	"exit_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goal_key_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"target_value" numeric(12, 2),
	"current_value" numeric(12, 2),
	"unit" text,
	"weight" integer DEFAULT 100,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"manager_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"type" "goal_type" DEFAULT 'okr' NOT NULL,
	"status" "goal_status" DEFAULT 'draft' NOT NULL,
	"weight" integer DEFAULT 100,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"progress" integer DEFAULT 0,
	"metrics" jsonb,
	"parent_goal_id" uuid,
	"review_cycle_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"type" "interview_type" NOT NULL,
	"status" "interview_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"duration_minutes" integer DEFAULT 60,
	"location" text,
	"meeting_url" text,
	"interviewer_ids" uuid[] NOT NULL,
	"feedback" jsonb,
	"score" integer,
	"recommendation" text,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invite_token_index" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"tenant_schema" text NOT NULL,
	"invitation_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_requisitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"requirements" text,
	"responsibilities" text,
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"type" "job_type" DEFAULT 'full_time' NOT NULL,
	"location" text,
	"is_remote" boolean DEFAULT false,
	"min_salary" numeric(12, 2),
	"max_salary" numeric(12, 2),
	"currency" text DEFAULT 'SAR',
	"openings" integer DEFAULT 1,
	"hiring_manager_id" uuid,
	"recruiter_id" uuid,
	"posted_at" timestamp,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"status" "learning_status" DEFAULT 'planned' NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"due_date" date,
	"progress" integer DEFAULT 0,
	"score" numeric(5, 2),
	"certificate_url" text,
	"feedback" jsonb,
	"approved_by_id" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "learning_type" DEFAULT 'course' NOT NULL,
	"provider" text,
	"url" text,
	"duration_hours" integer,
	"cost" numeric(12, 2),
	"currency" text DEFAULT 'SAR',
	"skills" uuid[],
	"prerequisites" uuid[],
	"is_active" boolean DEFAULT true,
	"max_participants" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"leave_type_id" uuid NOT NULL,
	"balance" numeric(5, 1) NOT NULL,
	"year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"leave_type_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"days_allowed" integer DEFAULT 0 NOT NULL,
	"paid" boolean DEFAULT true NOT NULL,
	"rules" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"type" text,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"severity" text,
	"metadata" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"job_requisition_id" uuid NOT NULL,
	"status" "offer_status" DEFAULT 'draft' NOT NULL,
	"base_salary" numeric(12, 2) NOT NULL,
	"housing_allowance" numeric(12, 2) DEFAULT '0',
	"transport_allowance" numeric(12, 2) DEFAULT '0',
	"other_allowances" numeric(12, 2) DEFAULT '0',
	"bonus_structure" text,
	"benefits" jsonb,
	"start_date" date,
	"probation_months" integer DEFAULT 3,
	"offer_letter_url" text,
	"sent_at" timestamp,
	"accepted_at" timestamp,
	"declined_at" timestamp,
	"decline_reason" text,
	"expires_at" timestamp,
	"created_by_id" uuid,
	"approved_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"day_number" integer NOT NULL,
	"status" "onboarding_status" DEFAULT 'not_started' NOT NULL,
	"assigned_to_id" uuid,
	"due_date" date,
	"completed_at" timestamp,
	"completed_by_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_month" date NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_amount" numeric(14, 2),
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payslips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_run_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"basic" numeric(12, 2) NOT NULL,
	"housing" numeric(12, 2) NOT NULL,
	"transport" numeric(12, 2) NOT NULL,
	"overtime" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gross" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gosi_employee" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gosi_employer" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gosi_pension_employee" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gosi_pension_employer" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gosi_occ_hazards_employer" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gosi_saned_employer" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gosi_contributory_base" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gosi_rate_employee" numeric(6, 4) DEFAULT '0' NOT NULL,
	"gosi_rate_employer" numeric(6, 4) DEFAULT '0' NOT NULL,
	"gosi_system" text,
	"deductions" numeric(12, 2) DEFAULT '0' NOT NULL,
	"eosb_accrued" numeric(12, 2) DEFAULT '0' NOT NULL,
	"eosb_years_of_service" numeric(6, 3) DEFAULT '0' NOT NULL,
	"net_pay" numeric(12, 2) NOT NULL,
	"pdf_url" text,
	"breakdown" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" text,
	"mime_type" text,
	"effective_date" date NOT NULL,
	"expiry_date" date,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qiwa_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"qiwa_employee_id" text,
	"contract_type" "qiwa_contract_type" DEFAULT 'permanent' NOT NULL,
	"status" "qiwa_contract_status" DEFAULT 'draft' NOT NULL,
	"job_title" text NOT NULL,
	"department" text,
	"salary" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"work_hours" text DEFAULT '8' NOT NULL,
	"work_days" text DEFAULT 'Sunday-Monday-Tuesday-Wednesday-Thursday' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"termination_date" date,
	"resignation_date" date,
	"notice_period_days" integer DEFAULT 60,
	"housing_allowance" numeric(12, 2) DEFAULT '0',
	"transport_allowance" numeric(12, 2) DEFAULT '0',
	"other_allowances" jsonb,
	"gosi_contribution" numeric(12, 2) DEFAULT '0',
	"employer_contribution" numeric(12, 2) DEFAULT '0',
	"qiwa_payload" jsonb,
	"qiwa_response" jsonb,
	"last_sync_at" timestamp,
	"sync_error" text,
	"is_saudization_priority" boolean DEFAULT false,
	"nationality" text,
	"iqama_expiry_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qiwa_sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"action" text NOT NULL,
	"request_payload" jsonb,
	"response_payload" jsonb,
	"status" text NOT NULL,
	"error_message" text,
	"performed_at" timestamp DEFAULT now() NOT NULL,
	"duration_ms" integer
);
--> statement-breakpoint
CREATE TABLE "recognitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_employee_id" uuid NOT NULL,
	"to_employee_id" uuid NOT NULL,
	"type" "recognition_type" DEFAULT 'peer' NOT NULL,
	"message" text NOT NULL,
	"values" text[],
	"is_public" boolean DEFAULT true,
	"reward_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reference_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"application_id" uuid,
	"referee_name" text NOT NULL,
	"referee_title" text,
	"referee_company" text,
	"referee_email" text,
	"referee_phone" text,
	"relationship" text,
	"status" "reference_check_status" DEFAULT 'pending' NOT NULL,
	"feedback" jsonb,
	"conducted_at" timestamp,
	"conducted_by_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_employee_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"job_requisition_id" uuid,
	"status" "referral_status" DEFAULT 'submitted' NOT NULL,
	"reward_amount" numeric(12, 2),
	"reward_paid_at" timestamp,
	"reward_paid_by_id" uuid,
	"notes" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "review_type" DEFAULT 'annual' NOT NULL,
	"status" "review_cycle_status" DEFAULT 'planned' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"self_review_start_date" date,
	"self_review_end_date" date,
	"manager_review_start_date" date,
	"manager_review_end_date" date,
	"calibration_start_date" date,
	"calibration_end_date" date,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"responses" jsonb,
	"rating" integer,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_cycle_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0,
	"weight" integer DEFAULT 100,
	"is_required" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_cycle_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"manager_id" uuid,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"type" "review_type" DEFAULT 'annual' NOT NULL,
	"self_review" jsonb,
	"manager_review" jsonb,
	"final_rating" integer,
	"calibration_notes" text,
	"acknowledged_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reward_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"redeemed_at" timestamp DEFAULT now() NOT NULL,
	"approved_by_id" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "reward_type" DEFAULT 'non_monetary' NOT NULL,
	"value" numeric(12, 2),
	"currency" text DEFAULT 'SAR',
	"quantity" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_gaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"required_level" "proficiency_level" NOT NULL,
	"current_level" "proficiency_level" NOT NULL,
	"gap_reason" text,
	"identified_at" timestamp DEFAULT now() NOT NULL,
	"target_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" "skill_category" DEFAULT 'technical' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stay_interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"interviewer_id" uuid,
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"status" "stay_interview_status" DEFAULT 'scheduled' NOT NULL,
	"responses" jsonb,
	"risk_factors" jsonb,
	"action_items" jsonb,
	"follow_up_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "succession_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"succession_plan_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"status" "succession_status" DEFAULT 'identified' NOT NULL,
	"readiness_score" integer,
	"development_areas" jsonb,
	"development_plan" text,
	"nominated_by_id" uuid,
	"nominated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "succession_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"department_id" uuid,
	"incumbent_id" uuid,
	"status" "succession_status" DEFAULT 'identified' NOT NULL,
	"risk_level" text,
	"readiness_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"employee_id" uuid,
	"responses" jsonb,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talent_review_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"talent_review_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"reviewer_id" uuid,
	"performance_rating" integer,
	"potential_rating" integer,
	"nine_box_position" text,
	"strengths" text,
	"development_areas" text,
	"next_steps" text,
	"is_high_potential" boolean DEFAULT false,
	"retention_risk" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talent_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"review_date" date NOT NULL,
	"status" text DEFAULT 'planned',
	"participants" uuid[],
	"facilitator_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"cr_number" text NOT NULL,
	"nitaqat_activity" text DEFAULT '' NOT NULL,
	"industry" text,
	"company_size" text,
	"website" text,
	"plan_tier" "plan_tier" DEFAULT 'basic' NOT NULL,
	"regulatory_context" "regulatory_context" DEFAULT 'saudi' NOT NULL,
	"schema_name" text NOT NULL,
	"onboarding_completed" text DEFAULT 'false' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_cr_number_unique" UNIQUE("cr_number"),
	CONSTRAINT "tenants_schema_name_unique" UNIQUE("schema_name")
);
--> statement-breakpoint
CREATE TABLE "total_rewards_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"base_salary" numeric(12, 2),
	"housing_allowance" numeric(12, 2),
	"transport_allowance" numeric(12, 2),
	"other_allowances" numeric(12, 2),
	"bonus" numeric(12, 2),
	"benefits_value" numeric(12, 2),
	"equity_value" numeric(12, 2),
	"total_value" numeric(12, 2),
	"currency" text DEFAULT 'SAR',
	"breakdown" jsonb,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"name" text,
	"image" text,
	"email_verified" timestamp,
	"role" "user_role" DEFAULT 'employee' NOT NULL,
	"preferred_language" "preferred_language" DEFAULT 'en' NOT NULL,
	"mfa_secret" text,
	"employee_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wage_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_run_id" uuid NOT NULL,
	"format" text DEFAULT 'mudad' NOT NULL,
	"file_url" text,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attendance_record_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"attendance_exception_type" "attendance_exception_type" NOT NULL,
	"attendance_exception_status" "attendance_exception_status" DEFAULT 'open' NOT NULL,
	"minutes" integer,
	"description" text,
	"resolved_by_user_id" uuid,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"work_date" date NOT NULL,
	"punch_sequence" integer DEFAULT 1 NOT NULL,
	"shift_id" uuid,
	"punch_in_at" timestamp,
	"punch_out_at" timestamp,
	"scheduled_start" time,
	"scheduled_end" time,
	"worked_minutes" integer DEFAULT 0 NOT NULL,
	"overtime_minutes" integer DEFAULT 0 NOT NULL,
	"late_minutes" integer DEFAULT 0 NOT NULL,
	"early_leave_minutes" integer DEFAULT 0 NOT NULL,
	"attendance_status" "attendance_status" DEFAULT 'present' NOT NULL,
	"work_location" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"shift_id" uuid NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"grace_minutes" integer DEFAULT 10 NOT NULL,
	"work_days" text DEFAULT 'sun,mon,tue,wed,thu' NOT NULL,
	"break_minutes" integer DEFAULT 60 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"role" "invite_role" DEFAULT 'employee' NOT NULL,
	"invited_by_user_id" uuid NOT NULL,
	"department_id" uuid,
	"full_name" text NOT NULL,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"approver_employee_id" uuid,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"expense_date" date NOT NULL,
	"receipt_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"approved_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guide_maps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"center_lat" numeric(10, 7) NOT NULL,
	"center_lng" numeric(10, 7) NOT NULL,
	"zoom" text DEFAULT '12' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_churn_predictions" ADD CONSTRAINT "ai_churn_predictions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_compliance_predictions" ADD CONSTRAINT "ai_compliance_predictions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_compliance_predictions" ADD CONSTRAINT "ai_compliance_predictions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_jd_enhancements" ADD CONSTRAINT "ai_jd_enhancements_job_requisition_id_job_requisitions_id_fk" FOREIGN KEY ("job_requisition_id") REFERENCES "public"."job_requisitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_retention_risk_flags" ADD CONSTRAINT "ai_retention_risk_flags_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_skill_recommendations" ADD CONSTRAINT "ai_skill_recommendations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_requisition_id_job_requisitions_id_fk" FOREIGN KEY ("job_requisition_id") REFERENCES "public"."job_requisitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_screened_by_id_employees_id_fk" FOREIGN KEY ("screened_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_referrer_employee_id_employees_id_fk" FOREIGN KEY ("referrer_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "background_checks" ADD CONSTRAINT "background_checks_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "background_checks" ADD CONSTRAINT "background_checks_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_paths" ADD CONSTRAINT "career_paths_from_role_id_career_roles_id_fk" FOREIGN KEY ("from_role_id") REFERENCES "public"."career_roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_paths" ADD CONSTRAINT "career_paths_to_role_id_career_roles_id_fk" FOREIGN KEY ("to_role_id") REFERENCES "public"."career_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_roles" ADD CONSTRAINT "career_roles_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compensation_adjustments" ADD CONSTRAINT "compensation_adjustments_plan_id_compensation_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."compensation_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compensation_adjustments" ADD CONSTRAINT "compensation_adjustments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compensation_adjustments" ADD CONSTRAINT "compensation_adjustments_approved_by_id_employees_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_career_paths" ADD CONSTRAINT "employee_career_paths_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_career_paths" ADD CONSTRAINT "employee_career_paths_career_path_id_career_paths_id_fk" FOREIGN KEY ("career_path_id") REFERENCES "public"."career_paths"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_skills" ADD CONSTRAINT "employee_skills_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_skills" ADD CONSTRAINT "employee_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_skills" ADD CONSTRAINT "employee_skills_verified_by_id_employees_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employment_history" ADD CONSTRAINT "employment_history_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_settlements" ADD CONSTRAINT "final_settlements_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_key_results" ADD CONSTRAINT "goal_key_results_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_manager_id_employees_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_parent_goal_id_goals_id_fk" FOREIGN KEY ("parent_goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_hiring_manager_id_employees_id_fk" FOREIGN KEY ("hiring_manager_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_recruiter_id_employees_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_enrollments" ADD CONSTRAINT "learning_enrollments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_enrollments" ADD CONSTRAINT "learning_enrollments_program_id_learning_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."learning_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_enrollments" ADD CONSTRAINT "learning_enrollments_approved_by_id_employees_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_job_requisition_id_job_requisitions_id_fk" FOREIGN KEY ("job_requisition_id") REFERENCES "public"."job_requisitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_created_by_id_employees_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_approved_by_id_employees_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_plans" ADD CONSTRAINT "onboarding_plans_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_plans" ADD CONSTRAINT "onboarding_plans_assigned_to_id_employees_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_plans" ADD CONSTRAINT "onboarding_plans_completed_by_id_employees_id_fk" FOREIGN KEY ("completed_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qiwa_contracts" ADD CONSTRAINT "qiwa_contracts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qiwa_sync_logs" ADD CONSTRAINT "qiwa_sync_logs_contract_id_qiwa_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."qiwa_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_from_employee_id_employees_id_fk" FOREIGN KEY ("from_employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_to_employee_id_employees_id_fk" FOREIGN KEY ("to_employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_checks" ADD CONSTRAINT "reference_checks_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_checks" ADD CONSTRAINT "reference_checks_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_checks" ADD CONSTRAINT "reference_checks_conducted_by_id_employees_id_fk" FOREIGN KEY ("conducted_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_employee_id_employees_id_fk" FOREIGN KEY ("referrer_employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_job_requisition_id_job_requisitions_id_fk" FOREIGN KEY ("job_requisition_id") REFERENCES "public"."job_requisitions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_reward_paid_by_id_employees_id_fk" FOREIGN KEY ("reward_paid_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_section_id_review_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."review_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_reviewer_id_employees_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_sections" ADD CONSTRAINT "review_sections_review_cycle_id_review_cycles_id_fk" FOREIGN KEY ("review_cycle_id") REFERENCES "public"."review_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_review_cycle_id_review_cycles_id_fk" FOREIGN KEY ("review_cycle_id") REFERENCES "public"."review_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_manager_id_employees_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_approved_by_id_employees_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_gaps" ADD CONSTRAINT "skill_gaps_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_gaps" ADD CONSTRAINT "skill_gaps_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stay_interviews" ADD CONSTRAINT "stay_interviews_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stay_interviews" ADD CONSTRAINT "stay_interviews_interviewer_id_employees_id_fk" FOREIGN KEY ("interviewer_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "succession_candidates" ADD CONSTRAINT "succession_candidates_succession_plan_id_succession_plans_id_fk" FOREIGN KEY ("succession_plan_id") REFERENCES "public"."succession_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "succession_candidates" ADD CONSTRAINT "succession_candidates_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "succession_candidates" ADD CONSTRAINT "succession_candidates_nominated_by_id_employees_id_fk" FOREIGN KEY ("nominated_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "succession_plans" ADD CONSTRAINT "succession_plans_role_id_career_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."career_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "succession_plans" ADD CONSTRAINT "succession_plans_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "succession_plans" ADD CONSTRAINT "succession_plans_incumbent_id_employees_id_fk" FOREIGN KEY ("incumbent_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_engagement_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."engagement_surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talent_review_participants" ADD CONSTRAINT "talent_review_participants_talent_review_id_talent_reviews_id_fk" FOREIGN KEY ("talent_review_id") REFERENCES "public"."talent_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talent_review_participants" ADD CONSTRAINT "talent_review_participants_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talent_review_participants" ADD CONSTRAINT "talent_review_participants_reviewer_id_employees_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talent_reviews" ADD CONSTRAINT "talent_reviews_facilitator_id_employees_id_fk" FOREIGN KEY ("facilitator_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "total_rewards_statements" ADD CONSTRAINT "total_rewards_statements_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wage_files" ADD CONSTRAINT "wage_files_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exceptions" ADD CONSTRAINT "attendance_exceptions_attendance_record_id_attendance_records_id_fk" FOREIGN KEY ("attendance_record_id") REFERENCES "public"."attendance_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exceptions" ADD CONSTRAINT "attendance_exceptions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approver_employee_id_employees_id_fk" FOREIGN KEY ("approver_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guide_maps" ADD CONSTRAINT "guide_maps_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_audit_logs_action_idx" ON "ai_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "ai_audit_logs_entity_idx" ON "ai_audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "ai_candidate_matchings_candidate_idx" ON "ai_candidate_matchings" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "ai_candidate_matchings_job_idx" ON "ai_candidate_matchings" USING btree ("job_requisition_id");--> statement-breakpoint
CREATE INDEX "ai_churn_predictions_employee_idx" ON "ai_churn_predictions" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "ai_churn_predictions_risk_idx" ON "ai_churn_predictions" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "ai_compliance_preds_dept_idx" ON "ai_compliance_predictions" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "ai_compliance_preds_employee_idx" ON "ai_compliance_predictions" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "ai_compliance_preds_type_idx" ON "ai_compliance_predictions" USING btree ("risk_type");--> statement-breakpoint
CREATE INDEX "ai_interview_feedback_interview_idx" ON "ai_interview_feedback" USING btree ("interview_id");--> statement-breakpoint
CREATE INDEX "ai_jd_enhancements_job_idx" ON "ai_jd_enhancements" USING btree ("job_requisition_id");--> statement-breakpoint
CREATE INDEX "ai_retention_risk_flags_employee_idx" ON "ai_retention_risk_flags" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "ai_retention_risk_flags_type_idx" ON "ai_retention_risk_flags" USING btree ("flag_type");--> statement-breakpoint
CREATE INDEX "ai_skill_recs_employee_idx" ON "ai_skill_recommendations" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "ai_suggestions_employee_idx" ON "ai_suggestions" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "ai_suggestions_type_idx" ON "ai_suggestions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ai_suggestions_status_idx" ON "ai_suggestions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_suggestions_dept_idx" ON "ai_suggestions" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "ai_survey_sentiments_survey_idx" ON "ai_survey_sentiments" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "applications_job_requisition_idx" ON "applications" USING btree ("job_requisition_id");--> statement-breakpoint
CREATE INDEX "applications_candidate_idx" ON "applications" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_unique_idx" ON "applications" USING btree ("job_requisition_id","candidate_id");--> statement-breakpoint
CREATE INDEX "background_checks_candidate_idx" ON "background_checks" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "background_checks_status_idx" ON "background_checks" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "candidates_email_idx" ON "candidates" USING btree ("email");--> statement-breakpoint
CREATE INDEX "candidates_source_idx" ON "candidates" USING btree ("source");--> statement-breakpoint
CREATE INDEX "career_paths_from_role_idx" ON "career_paths" USING btree ("from_role_id");--> statement-breakpoint
CREATE INDEX "career_paths_to_role_idx" ON "career_paths" USING btree ("to_role_id");--> statement-breakpoint
CREATE INDEX "career_paths_status_idx" ON "career_paths" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "career_roles_title_idx" ON "career_roles" USING btree ("title");--> statement-breakpoint
CREATE INDEX "career_roles_department_idx" ON "career_roles" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "career_roles_level_idx" ON "career_roles" USING btree ("level");--> statement-breakpoint
CREATE INDEX "compensation_adjustments_plan_idx" ON "compensation_adjustments" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "compensation_adjustments_employee_idx" ON "compensation_adjustments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "compensation_adjustments_status_idx" ON "compensation_adjustments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "compensation_plans_status_idx" ON "compensation_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "employee_career_paths_employee_idx" ON "employee_career_paths" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_career_paths_path_idx" ON "employee_career_paths" USING btree ("career_path_id");--> statement-breakpoint
CREATE INDEX "employee_career_paths_status_idx" ON "employee_career_paths" USING btree ("status");--> statement-breakpoint
CREATE INDEX "employee_skills_employee_idx" ON "employee_skills" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_skills_skill_idx" ON "employee_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_skills_unique_idx" ON "employee_skills" USING btree ("employee_id","skill_id");--> statement-breakpoint
CREATE INDEX "engagement_surveys_status_idx" ON "engagement_surveys" USING btree ("status");--> statement-breakpoint
CREATE INDEX "goal_key_results_goal_idx" ON "goal_key_results" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "goals_employee_idx" ON "goals" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "goals_manager_idx" ON "goals" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "goals_status_idx" ON "goals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "goals_review_cycle_idx" ON "goals" USING btree ("review_cycle_id");--> statement-breakpoint
CREATE INDEX "goals_parent_idx" ON "goals" USING btree ("parent_goal_id");--> statement-breakpoint
CREATE INDEX "interviews_application_idx" ON "interviews" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "interviews_scheduled_idx" ON "interviews" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "interviews_status_idx" ON "interviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invite_token_index_token_idx" ON "invite_token_index" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invite_token_index_status_idx" ON "invite_token_index" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "job_requisitions_status_idx" ON "job_requisitions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_requisitions_department_idx" ON "job_requisitions" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "job_requisitions_hiring_manager_idx" ON "job_requisitions" USING btree ("hiring_manager_id");--> statement-breakpoint
CREATE INDEX "learning_enrollments_employee_idx" ON "learning_enrollments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "learning_enrollments_program_idx" ON "learning_enrollments" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "learning_enrollments_status_idx" ON "learning_enrollments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "learning_programs_type_idx" ON "learning_programs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "learning_programs_active_idx" ON "learning_programs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "offers_application_idx" ON "offers" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "offers_candidate_idx" ON "offers" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "offers_status_idx" ON "offers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "onboarding_plans_employee_idx" ON "onboarding_plans" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "onboarding_plans_day_idx" ON "onboarding_plans" USING btree ("day_number");--> statement-breakpoint
CREATE INDEX "onboarding_plans_status_idx" ON "onboarding_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "qiwa_contracts_employee_idx" ON "qiwa_contracts" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "qiwa_contracts_status_idx" ON "qiwa_contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "qiwa_contracts_qiwa_id_idx" ON "qiwa_contracts" USING btree ("qiwa_employee_id");--> statement-breakpoint
CREATE INDEX "qiwa_contracts_start_date_idx" ON "qiwa_contracts" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "qiwa_sync_logs_contract_idx" ON "qiwa_sync_logs" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "qiwa_sync_logs_status_idx" ON "qiwa_sync_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "qiwa_sync_logs_performed_at_idx" ON "qiwa_sync_logs" USING btree ("performed_at");--> statement-breakpoint
CREATE INDEX "recognitions_from_idx" ON "recognitions" USING btree ("from_employee_id");--> statement-breakpoint
CREATE INDEX "recognitions_to_idx" ON "recognitions" USING btree ("to_employee_id");--> statement-breakpoint
CREATE INDEX "recognitions_type_idx" ON "recognitions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "reference_checks_candidate_idx" ON "reference_checks" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "reference_checks_status_idx" ON "reference_checks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "referrals_referrer_idx" ON "referrals" USING btree ("referrer_employee_id");--> statement-breakpoint
CREATE INDEX "referrals_candidate_idx" ON "referrals" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "referrals_status_idx" ON "referrals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "review_cycles_status_idx" ON "review_cycles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "review_cycles_date_idx" ON "review_cycles" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "review_responses_review_idx" ON "review_responses" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "review_responses_section_idx" ON "review_responses" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "review_responses_reviewer_idx" ON "review_responses" USING btree ("reviewer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "review_responses_unique_idx" ON "review_responses" USING btree ("review_id","section_id","reviewer_id");--> statement-breakpoint
CREATE INDEX "review_sections_cycle_idx" ON "review_sections" USING btree ("review_cycle_id");--> statement-breakpoint
CREATE INDEX "reviews_cycle_idx" ON "reviews" USING btree ("review_cycle_id");--> statement-breakpoint
CREATE INDEX "reviews_employee_idx" ON "reviews" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "reviews_manager_idx" ON "reviews" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_unique_idx" ON "reviews" USING btree ("review_cycle_id","employee_id");--> statement-breakpoint
CREATE INDEX "reward_redemptions_reward_idx" ON "reward_redemptions" USING btree ("reward_id");--> statement-breakpoint
CREATE INDEX "reward_redemptions_employee_idx" ON "reward_redemptions" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "rewards_type_idx" ON "rewards" USING btree ("type");--> statement-breakpoint
CREATE INDEX "rewards_active_idx" ON "rewards" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "skill_gaps_employee_idx" ON "skill_gaps" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "skill_gaps_skill_idx" ON "skill_gaps" USING btree ("skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skills_name_idx" ON "skills" USING btree ("name");--> statement-breakpoint
CREATE INDEX "skills_category_idx" ON "skills" USING btree ("category");--> statement-breakpoint
CREATE INDEX "stay_interviews_employee_idx" ON "stay_interviews" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "stay_interviews_status_idx" ON "stay_interviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "succession_candidates_plan_idx" ON "succession_candidates" USING btree ("succession_plan_id");--> statement-breakpoint
CREATE INDEX "succession_candidates_employee_idx" ON "succession_candidates" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "succession_candidates_status_idx" ON "succession_candidates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "succession_plans_role_idx" ON "succession_plans" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "succession_plans_department_idx" ON "succession_plans" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "succession_plans_status_idx" ON "succession_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "survey_responses_survey_idx" ON "survey_responses" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_responses_employee_idx" ON "survey_responses" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "talent_review_participants_review_idx" ON "talent_review_participants" USING btree ("talent_review_id");--> statement-breakpoint
CREATE INDEX "talent_review_participants_employee_idx" ON "talent_review_participants" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "talent_review_participants_reviewer_idx" ON "talent_review_participants" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "talent_reviews_status_idx" ON "talent_reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "total_rewards_employee_idx" ON "total_rewards_statements" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "total_rewards_period_idx" ON "total_rewards_statements" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "total_rewards_unique_idx" ON "total_rewards_statements" USING btree ("employee_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "attendance_exceptions_status_idx" ON "attendance_exceptions" USING btree ("attendance_exception_status");--> statement-breakpoint
CREATE INDEX "attendance_exceptions_emp_idx" ON "attendance_exceptions" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "attendance_records_emp_date_seq_idx" ON "attendance_records" USING btree ("employee_id","work_date","punch_sequence");--> statement-breakpoint
CREATE INDEX "attendance_records_date_idx" ON "attendance_records" USING btree ("work_date");--> statement-breakpoint
CREATE INDEX "shift_assignments_emp_idx" ON "shift_assignments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "shift_assignments_shift_idx" ON "shift_assignments" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "employee_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitations_token_idx" ON "employee_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invitations_status_idx" ON "employee_invitations" USING btree ("status");