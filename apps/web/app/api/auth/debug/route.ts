export async function GET() {
  const authSecret = process.env.AUTH_SECRET;
  const authUrl = process.env.AUTH_URL;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const dbUrl = process.env.DATABASE_URL;

  return Response.json({
    hasAuthSecret: !!authSecret,
    authSecretLength: authSecret?.length ?? 0,
    hasAuthUrl: !!authUrl,
    authUrlValue: authUrl ?? "not set",
    hasNextAuthUrl: !!nextAuthUrl,
    nextAuthUrlValue: nextAuthUrl ?? "not set",
    hasDbUrl: !!dbUrl,
    nodeEnv: process.env.NODE_ENV,
  });
}
