import { Queue, Worker, Job } from "bullmq";
import { createClient } from "redis";

export interface QueueConfig {
  redisUrl: string;
}

export interface AccrualJobData {
  tenantId: string;
  frequency: "monthly" | "annual";
  effectiveDate?: string;
  year?: number;
}

export interface ExpiryAlertJobData {
  tenantId: string;
  checkDate?: string;
  thresholds?: number[];
}

export interface JobResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

const QUEUE_NAMES = {
  accrual: "leave-accrual",
  expiryAlert: "document-expiry-alert",
} as const;

export function createRedisClient(redisUrl: string) {
  return createClient({ url: redisUrl });
}

export function createAccrualQueue(config: QueueConfig) {
  return new Queue<AccrualJobData, JobResult>(QUEUE_NAMES.accrual, {
    connection: { url: config.redisUrl },
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    },
  });
}

export function createExpiryAlertQueue(config: QueueConfig) {
  return new Queue<ExpiryAlertJobData, JobResult>(QUEUE_NAMES.expiryAlert, {
    connection: { url: config.redisUrl },
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    },
  });
}

export function createAccrualWorker(
  config: QueueConfig,
  processor: (job: Job<AccrualJobData>) => Promise<JobResult>
) {
  return new Worker<AccrualJobData, JobResult>(QUEUE_NAMES.accrual, processor, {
    connection: { url: config.redisUrl },
    concurrency: 2,
  });
}

export function createExpiryAlertWorker(
  config: QueueConfig,
  processor: (job: Job<ExpiryAlertJobData>) => Promise<JobResult>
) {
  return new Worker<ExpiryAlertJobData, JobResult>(QUEUE_NAMES.expiryAlert, processor, {
    connection: { url: config.redisUrl },
    concurrency: 2,
  });
}

export async function scheduleMonthlyAccrual(
  queue: Queue<AccrualJobData>,
  tenantId: string,
  effectiveDate: Date = new Date()
) {
  await queue.add(
    "monthly-accrual",
    { tenantId, frequency: "monthly", effectiveDate: effectiveDate.toISOString() },
    {
      repeat: { pattern: "0 2 1 * *", tz: "Asia/Riyadh" },
      jobId: `monthly-accrual-${tenantId}`,
    }
  );
}

export async function scheduleAnnualAccrual(
  queue: Queue<AccrualJobData>,
  tenantId: string,
  effectiveDate: Date = new Date()
) {
  await queue.add(
    "annual-accrual",
    { tenantId, frequency: "annual", effectiveDate: effectiveDate.toISOString() },
    {
      repeat: { pattern: "0 2 1 1 *", tz: "Asia/Riyadh" },
      jobId: `annual-accrual-${tenantId}`,
    }
  );
}

export async function scheduleDailyExpiryCheck(
  queue: Queue<ExpiryAlertJobData>,
  tenantId: string,
  thresholds: number[] = [90, 60, 30, 14, 7, 1]
) {
  await queue.add(
    "daily-expiry-check",
    { tenantId, thresholds },
    {
      repeat: { pattern: "0 8 * * *", tz: "Asia/Riyadh" },
      jobId: `daily-expiry-check-${tenantId}`,
    }
  );
}

export { QUEUE_NAMES };
export { LeaveAccrualService } from "./leave-accrual";
export { DocumentExpiryService } from "./document-expiry";
export { startWorkers } from "./workers";
export type { WorkerConfig } from "./workers";