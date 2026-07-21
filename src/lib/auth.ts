import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { scryptSync, timingSafeEqual } from "crypto";

/**
 * Mithqal operator authentication.
 *
 * A single operator account is defined by environment variables
 * (ADMIN_EMAIL + ADMIN_PASSWORD_HASH). The password is verified against a
 * scrypt hash — no plaintext password is ever stored. No user table is
 * required for auth; the operator is the env-defined principal.
 *
 * Sessions are JWT-based (stateless), so no DB session store is needed.
 */
function verifyPassword(submitted: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = scryptSync(submitted, salt, expected.length);
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8h operator session
  pages: {
    // We don't use a separate route — the Admin view renders its own login
    // card and calls signIn("credentials", { redirect: false }).
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "Operator",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        const expectedEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
        if (!email || !password || email !== expectedEmail) return null;
        if (!verifyPassword(password)) return null;
        return { id: "operator", email, name: "Operator" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email ?? token.email;
        token.role = "operator";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};

export type Role = "operator";
