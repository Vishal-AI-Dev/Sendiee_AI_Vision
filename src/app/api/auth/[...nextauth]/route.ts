import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

// The configuration block: This acts as the rulebook for your authentication.
const authOptions = {
  providers: [
    // Block 1: Google OAuth
    // This connects to the Google Cloud project you just set up.
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),

    // Block 2: Standard Email/Password
    // This gives you direct control to validate inputs against your own database later.
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@sendiee.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Later in the week, you will write the logic here to query MongoDB.
        // For testing today, we are hardcoding a dummy admin user.
        if (credentials?.email === "admin@test.com" && credentials?.password === "password123") {
          return { id: "1", name: "Admin", email: "admin@test.com" }; // Success
        }
        return null; // Failure - triggers an "Invalid credentials" error
      }
    })
  ]
};

// The Next.js Route Handler
const handler = NextAuth(authOptions);

// Exporting the handler as both GET and POST
export { handler as GET, handler as POST };