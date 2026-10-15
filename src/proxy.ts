import { withAuth } from "next-auth/middleware";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (runs on the Node.js runtime).
// This only gates the admin portal pages. API routes guard themselves with
// `withAdmin()` from `@/lib/auth` so they can answer 401 JSON instead of a redirect.
export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/admin/:path*"],
};
