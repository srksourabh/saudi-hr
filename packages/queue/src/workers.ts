import { createRedisClient, createAccrualWorker, createExpiryAlertWorker, createAccrualQueue, createExpiryAlertQueue, scheduleMonthlyAccrual, scheduleAnnualAccrual, scheduleDailyExpiryCheck, type AccrualJobData, type ExpiryAlertJobData, type JobResult } from "./index";
import { LeaveAccrualService } from "./leave-accrual";
import { DocumentExpiryService } from "./document-expiry";
import type { Job } from "bullmq";

export interface WorkerConfig {
  redisUrl: string;
  tenantId: string;
  databaseUrl: string;
}

export async function startWorkers(config: WorkerConfig) {
  const redis = createRedisClient(config.redisUrl);
  await redis.connect();

  const accrualQueue = createAccrualQueue({ redisUrl: config.redisUrl });
  const expiryQueue = createExpiryAlertQueue({ redisUrl: config.redisUrl });

  const accrualService = new LeaveAccrualService({
    tenantId: config.tenantId,
    databaseUrl: config.databaseUrl,
  });

  const expiryService = new DocumentExpiryService({
    tenantId: config.tenantId,
    databaseUrl: config.databaseUrl,
  });

  const accrualWorker = createAccrualWorker({ redisUrl: config.redisUrl }, async (job: Job<AccrualJobData>) => {
    console.log(`[Accrual] Processing job ${job.id} for tenant ${config.tenantId}`);
    return await accrualService.runAccrual(job.data);
  });

  const expiryWorker = createExpiryAlertWorker({ redisUrl: config.redisUrl }, async (job: Job<ExpiryAlertJobData>) => {
    console.log(`[Expiry] Processing job ${job.id} for tenant ${config.tenantId}`);
    return await expiryService.runExpiryCheck(job.data);
  });

  accrualWorker.on("completed", (job: Job<AccrualJobData, JobResult>) => {
    console.log(`[Accrual] Job ${job.id} completed:`, job.returnvalue);
  });

  accrualWorker.on("failed", (job: Job<AccrualJobData, JobResult> | undefined, err: Error) => {
    console.error(`[Accrual] Job ${job?.id} failed:`, err);
  });

  expiryWorker.on("completed", (job: Job<ExpiryAlertJobData, JobResult>) => {
    console.log(`[Expiry] Job ${job.id} completed:`, job.returnvalue);
  });

  expiryWorker.on("failed", (job: Job<ExpiryAlertJobData, JobResult> | undefined, err: Error) => {
    console.error(`[Expiry] Job ${job?.id} failed:`, err);
  });

  await scheduleMonthlyAccrual(accrualQueue, config.tenantId);
  await scheduleAnnualAccrual(accrualQueue, config.tenantId);
  await scheduleDailyExpiryCheck(expiryQueue, config.tenantId);

  console.log(`Workers started for tenant ${config.tenantId}`);

  return {
    redis,
    accrualWorker,
    expiryWorker,
    accrualQueue,
    expiryQueue,
    accrualService,
    expiryService,
    async shutdown() {
      await accrualWorker.close();
      await expiryWorker.close();
      await accrualQueue.close();
      await expiryQueue.close();
      await redis.quit();
    },
  };
}