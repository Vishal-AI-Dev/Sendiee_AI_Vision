import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import clientPromise from "@/lib/mongodb";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const client = await clientPromise;
        const user = await client.db("sendiee_vision").collection("users").findOne({ email });
        if (!user || typeof user.passwordHash !== "string") return null;
        if (!(await compare(password, user.passwordHash))) return null;

        return { id: user._id.toString(), name: String(user.name ?? email.split("@")[0]), email };
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // When user logs in, save their database ID into the JWT token
      if (user) {
        token.id = user.id;
      }
      return token;
    },
async session({ session, token }) {
      if (session.user) {
        Object.assign(session.user, { id: token.id as string });
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };