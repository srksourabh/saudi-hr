import { handlers } from "@hrms-app/auth";

export const GET = handlers.GET as unknown as (request: Request, context: { params: Promise<{ nextauth: string[] }> }) => Promise<Response>;
export const POST = handlers.POST as unknown as (request: Request, context: { params: Promise<{ nextauth: string[] }> }) => Promise<Response>;
