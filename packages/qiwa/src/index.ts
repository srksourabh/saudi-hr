import { z } from "zod";

export const qiwaEnvironment = z.enum(["production", "sandbox"]);

export const qiwaApiConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  environment: qiwaEnvironment,
  baseUrl: z.string().url(),
});

export type QiwaApiConfig = z.infer<typeof qiwaApiConfigSchema>;

export const qiwaEmployeeSchema = z.object({
  id: z.string().uuid(),
  qiwaEmployeeId: z.string().optional(),
  fullName: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  nationality: z.string(),
  iqamaNumber: z.string().optional(),
  passportNumber: z.string().optional(),
  iqamaExpiryDate: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  salary: z.number().optional(),
  currency: z.string().default("SAR"),
  workHours: z.string().optional(),
  workDays: z.string().optional(),
  housingAllowance: z.number().optional(),
  transportAllowance: z.number().optional(),
  gosiContribution: z.number().optional(),
  employerContribution: z.number().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  maritalStatus: z.string().optional(),
  educationLevel: z.string().optional(),
  jobLevel: z.string().optional(),
  joiningDate: z.string().optional(),
  terminationDate: z.string().optional(),
  noticePeriodDays: z.number().optional(),
  otherAllowances: z.record(z.any()).optional(),
  isSaudizationPriority: z.boolean().optional(),
});

export type QiwaEmployee = z.infer<typeof qiwaEmployeeSchema>;

export const qiwaContractSchema = z.object({
  id: z.string().uuid().optional(),
  qiwaEmployeeId: z.string().optional(),
  contractType: z.enum(["permanent", "contract", "probation"]),
  jobTitle: z.string(),
  department: z.string(),
  salary: z.number(),
  currency: z.string().default("SAR"),
  workHours: z.string(),
  workDays: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
  terminationDate: z.string().optional(),
  resignationDate: z.string().optional(),
  noticePeriodDays: z.number().default(60),
  housingAllowance: z.number().default(0),
  transportAllowance: z.number().default(0),
  otherAllowances: z.record(z.any()).optional(),
  gosiContribution: z.number().default(0),
  employerContribution: z.number().default(0),
  nationality: z.string(),
  iqamaExpiryDate: z.string().optional(),
  isSaudizationPriority: z.boolean().default(false),
});

export type QiwaContract = z.infer<typeof qiwaContractSchema>;

export const qiwaSubmissionResponseSchema = z.object({
  success: z.boolean(),
  qiwaEmployeeId: z.string().optional(),
  contractId: z.string().optional(),
  message: z.string().optional(),
  errors: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
});

export type QiwaSubmissionResponse = z.infer<typeof qiwaSubmissionResponseSchema>;

export const qiwaSyncStatusSchema = z.enum([
  "draft",
  "submitted",
  "accepted",
  "rejected",
  "terminated",
]);

export type QiwaSyncStatus = z.infer<typeof qiwaSyncStatusSchema>;

export interface QiwaApiClient {
  authenticate(): Promise<{ accessToken: string; expiresIn: number }>;
  submitEmployee(employee: QiwaEmployee): Promise<QiwaSubmissionResponse>;
  updateEmployee(qiwaEmployeeId: string, employee: Partial<QiwaEmployee>): Promise<QiwaSubmissionResponse>;
  submitContract(contract: QiwaContract): Promise<QiwaSubmissionResponse>;
  updateContract(qiwaEmployeeId: string, contract: Partial<QiwaContract>): Promise<QiwaSubmissionResponse>;
  getEmployee(qiwaEmployeeId: string): Promise<QiwaEmployee | null>;
  getContractStatus(qiwaEmployeeId: string): Promise<QiwaSyncStatus | null>;
  listEmployees(params?: { status?: string; page?: number; limit?: number }): Promise<QiwaEmployee[]>;
  testConnectivity(): Promise<boolean>;
}

// Bound every Qiwa call so a slow/hung government endpoint cannot hang the
// calling request indefinitely (QA-005).
const QIWA_TIMEOUT_MS = 20_000;

export class QiwaApiClientImpl implements QiwaApiClient {
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor(private config: QiwaApiConfig) {}

  private getAccessToken(): string {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      throw new Error("Not authenticated. Call authenticate() first.");
    }
    return this.accessToken;
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.getAccessToken()}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * fetch with a bounded timeout (QA-005). `retry: true` re-attempts once on a
   * network-level failure (timeout / connection reset) — used only for
   * idempotent GET reads, never for submit/update mutations.
   */
  private async request(url: string, init: RequestInit, opts?: { retry?: boolean }): Promise<Response> {
    const attempt = () => fetch(url, { ...init, signal: AbortSignal.timeout(QIWA_TIMEOUT_MS) });
    try {
      return await attempt();
    } catch (err) {
      if (opts?.retry) return await attempt();
      throw err;
    }
  }

  async authenticate(): Promise<{ accessToken: string; expiresIn: number }> {
    const response = await this.request(`${this.config.baseUrl}/api/v2/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Qiwa authentication failed: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const accessToken = data.access_token;
    if (!accessToken) {
      throw new Error("No access token received from Qiwa");
    }
    this.accessToken = accessToken;
    this.tokenExpiry = Date.now() + ((data.expires_in ?? 3600) * 1000) - 60000;

    return { accessToken: accessToken, expiresIn: data.expires_in ?? 3600 };
  }

  async submitEmployee(employee: QiwaEmployee): Promise<QiwaSubmissionResponse> {
    const response = await this.request(`${this.config.baseUrl}/api/v2/employees`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(employee),
    });

    const data = await response.json();
    return qiwaSubmissionResponseSchema.parse(data);
  }

  async updateEmployee(qiwaEmployeeId: string, employee: Partial<QiwaEmployee>): Promise<QiwaSubmissionResponse> {
    const response = await this.request(`${this.config.baseUrl}/api/v2/employees/${qiwaEmployeeId}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(employee),
    });

    const data = await response.json();
    return qiwaSubmissionResponseSchema.parse(data);
  }

  async submitContract(contract: QiwaContract): Promise<QiwaSubmissionResponse> {
    const response = await this.request(`${this.config.baseUrl}/api/v2/contracts`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(contract),
    });

    const data = await response.json();
    return qiwaSubmissionResponseSchema.parse(data);
  }

  async updateContract(qiwaEmployeeId: string, contract: Partial<QiwaContract>): Promise<QiwaSubmissionResponse> {
    const response = await this.request(`${this.config.baseUrl}/api/v2/contracts/${qiwaEmployeeId}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(contract),
    });

    const data = await response.json();
    return qiwaSubmissionResponseSchema.parse(data);
  }

  async getEmployee(qiwaEmployeeId: string): Promise<QiwaEmployee | null> {
    const response = await this.request(
      `${this.config.baseUrl}/api/v2/employees/${qiwaEmployeeId}`,
      { headers: this.getHeaders() },
      { retry: true },
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch employee: ${response.status}`);
    }

    const data = await response.json();
    return qiwaEmployeeSchema.parse(data);
  }

  async getContractStatus(qiwaEmployeeId: string): Promise<QiwaSyncStatus | null> {
    const response = await this.request(
      `${this.config.baseUrl}/api/v2/contracts/${qiwaEmployeeId}/status`,
      { headers: this.getHeaders() },
      { retry: true },
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch contract status: ${response.status}`);
    }

    const data = await response.json();
    return qiwaSyncStatusSchema.parse(data.status);
  }

  async listEmployees(params?: { status?: string; page?: number; limit?: number }): Promise<QiwaEmployee[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const response = await this.request(
      `${this.config.baseUrl}/api/v2/employees?${searchParams.toString()}`,
      { headers: this.getHeaders() },
      { retry: true },
    );

    if (!response.ok) {
      throw new Error(`Failed to list employees: ${response.status}`);
    }

    const data = await response.json();
    return (data.employees ?? data).map((emp: unknown) => qiwaEmployeeSchema.parse(emp));
  }

  async testConnectivity(): Promise<boolean> {
    try {
      await this.request(`${this.config.baseUrl}/api/v2/health`, {
        headers: this.getHeaders(),
      });
      return true;
    } catch {
      return false;
    }
  }
}

export function createQiwaClient(config: QiwaApiConfig): QiwaApiClient {
  return new QiwaApiClientImpl(config);
}
export * from "./nitaqat";
export * from "./contracts";
