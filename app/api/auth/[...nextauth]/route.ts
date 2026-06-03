import type { AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import bcrypt from "bcryptjs";

import { sql } from "@/lib/db";

type DatabaseUserRow = {
  id: number;
  email: string;
  password: string;
  role: string;
  name: string;
};

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",

      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const users = await sql`
          SELECT * FROM users
          WHERE email = ${credentials.email}
          LIMIT 1
        `;

        const user = users[0] as DatabaseUserRow | undefined;

        if (!user) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id.toString(),
          email: user.email,
          role: user.role,
          name: user.name,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: { id: string; role: string };
    }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role ?? "";
        session.user.id = token.id ?? "";
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET || "mysecret123456789",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
