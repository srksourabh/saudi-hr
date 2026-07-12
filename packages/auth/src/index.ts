import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { adminDb } from "@hrms-app/db";
import { users, tenants } from "@hrms-app/db";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";

declare module "next-auth" {
  interface User {
    role?: string;
    tenantId?: string;
    preferredLanguage?: "en" | "ar";
  }

  interface Session {
    user: {
      id: string;
      tenantId: string;
      role: string;
      regulatoryContext: "saudi" | "india";
      preferredLanguage: "en" | "ar";
    } & DefaultSession["user"];
  }

  interface JWT {
    role?: string;
    tenantId?: string;
    id?: string;
    regulatoryContext?: "saudi" | "india";
    preferredLanguage?: "en" | "ar";
  }
}

const nextAuthResult = NextAuth({
  trustHost: true,
  logger: {
    error(error) {
      console.error("[next-auth][error]", error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : "");
    },
    warn(code) { console.warn("[next-auth][warn]", code); },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
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
    async jwt({ token, user, account: _account }) {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;

        if (user.tenantId) {
          const tenant = await adminDb.query.tenants.findFirst({
            where: eq(tenants.id, user.tenantId),
          });
          token.regulatoryContext = tenant?.regulatoryContext ?? "saudi";
        } else {
          token.regulatoryContext = "saudi";
        }

        token.preferredLanguage = user.preferredLanguage ?? "en";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
          session.user.id = (token.sub ?? token.id) as string;
          session.user.role = token.role ?? "";
          session.user.tenantId = token.tenantId ?? "";
          session.user.regulatoryContext = token.regulatoryContext ?? "saudi";
          session.user.preferredLanguage = token.preferredLanguage ?? "en";
        }
      return session;
    },
  },
});

export const { handlers, signIn, signOut, auth } = nextAuthResult;
