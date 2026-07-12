import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { adminDb } from "@hrms-app/db";
import { users, tenants, accounts, sessions, verificationTokens } from "@hrms-app/db";
import { compare } from "bcryptjs";
import { env } from "@hrms-app/config";
import { eq } from "drizzle-orm";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      role: string;
      regulatoryContext: "saudi" | "india";
      preferredLanguage: "en" | "ar";
    } & DefaultSession["user"];
  }
}

const nextAuthResult = NextAuth({
  adapter: DrizzleAdapter(adminDb, {
    usersTable: users as any,
    accountsTable: accounts as any,
    sessionsTable: sessions as any,
    verificationTokensTable: verificationTokens as any,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID ?? "",
      clientSecret: env.AUTH_GOOGLE_SECRET ?? "",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await adminDb.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!user || !user.passwordHash) return null;

        const valid = await compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          tenantId: user.tenantId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        (token as any).role = (user as any).role;
        (token as any).tenantId = (user as any).tenantId;

        if ((user as any).tenantId) {
          const tenant = await adminDb.query.tenants.findFirst({
            where: eq(tenants.id, (user as any).tenantId),
          });
          (token as any).regulatoryContext = tenant?.regulatoryContext ?? "saudi";
        } else {
          (token as any).regulatoryContext = "saudi";
        }

        (token as any).preferredLanguage = (user as any).preferredLanguage ?? "en";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token as any).sub ?? (token as any).id;
        (session.user as any).role = (token as any).role;
        (session.user as any).tenantId = (token as any).tenantId;
        (session.user as any).regulatoryContext = (token as any).regulatoryContext ?? "saudi";
        (session.user as any).preferredLanguage = (token as any).preferredLanguage ?? "en";
      }
      return session;
    },
  },
});

export const { handlers, signIn, signOut, auth } = nextAuthResult as unknown as {
  handlers: { GET: Function; POST: Function };
  signIn: Function;
  signOut: Function;
  auth: Function;
};
