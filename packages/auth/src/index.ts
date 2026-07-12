import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { adminDb } from "@hrms-app/db";
import { users, tenants } from "@hrms-app/db";
import { compare } from "bcryptjs";
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
  secret: (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET) as string,
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
