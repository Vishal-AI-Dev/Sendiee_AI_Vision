import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

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
        // Here you would normally query your MongoDB database to verify the user.
        // For testing your session setup, this mock check ensures login works:
        if (credentials?.email === "admin@test.com" && credentials?.password === "password123") {
          return { id: "user_id_12345", name: "Admin User", email: "admin@test.com" };
        }
        return null;
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
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };