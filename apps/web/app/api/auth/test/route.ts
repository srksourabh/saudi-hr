import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const { handlers } = NextAuth({
  providers: [
    Credentials({
      async authorize() {
        return { id: "1", email: "test@test.com", name: "Test" };
      },
    }),
  ],
});

export const GET = handlers.GET as unknown as (request: Request) => Promise<Response>;
export const POST = handlers.POST as unknown as (request: Request) => Promise<Response>;
