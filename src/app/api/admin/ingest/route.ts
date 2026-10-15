import { withAdmin } from "@/lib/auth";

export const POST = withAdmin(async () => Response.json({ status: "ok" }));
