import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// Shared next-auth configuration. Route files can only export HTTP handlers,
// so the options live here and are imported by `app/api/auth/[...nextauth]/route.ts`.
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await (await getDb()).collection("users").findOne({ email });
        if (!user || typeof user.passwordHash !== "string") return null;
        if (!(await compare(password, user.passwordHash))) return null;

        return { id: user._id.toString(), name: String(user.name ?? email.split("@")[0]), email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, copy the database id into the JWT so sessions can carry it.
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === "string") session.user.id = token.id;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

/**
 * The signed-in admin for the current request, or null.
 * Every registered user is an admin in this proof of concept (there is no role field yet).
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.id || !user.email) return null;
  return { id: user.id, email: user.email, name: user.name ?? user.email.split("@")[0] };
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

type AdminHandler<Ctx> = (
  request: Request,
  context: Ctx,
  admin: AdminUser
) => Response | Promise<Response>;

/**
 * Wrap a route handler so it only runs for a signed-in admin.
 *
 *   export const POST = withAdmin(async (request, _ctx, admin) => { ... });
 *
 * Customer-facing routes (the Sendiee webhook / match endpoint) must NOT use this;
 * they need a shared-secret check instead, since there is no browser session there.
 */
export function withAdmin<Ctx = unknown>(handler: AdminHandler<Ctx>) {
  return async (request: Request, context: Ctx): Promise<Response> => {
    const admin = await getAdminUser();
    if (!admin) return unauthorized();
    return handler(request, context, admin);
  };
}
