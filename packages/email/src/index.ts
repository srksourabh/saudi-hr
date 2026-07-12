import { Resend } from "resend";
import { env } from "@hrms-app/config";

export const resend = new Resend(env.RESEND_API_KEY ?? "");

export { WelcomeEmail } from "./templates/welcome";
export { LeaveRequestEmail } from "./templates/leave-request";
export { LeaveStatusEmail } from "./templates/leave-status";
export { PayslipReadyEmail } from "./templates/payslip-ready";
export { DocumentExpiryEmail } from "./templates/document-expiry";
