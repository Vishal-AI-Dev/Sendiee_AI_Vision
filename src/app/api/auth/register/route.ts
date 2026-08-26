import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const client = await clientPromise;
    const users = client.db("sendiee_vision").collection("users");
    const existing = await users.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);
    const result = await users.insertOne({
      name: name || email.split("@")[0],
      email,
      passwordHash,
      createdAt: new Date(),
    });

    return NextResponse.json({
      user: { id: result.insertedId.toString(), name: name || email.split("@")[0], email },
    }, { status: 201 });
  } catch (error) {
    console.error("[register] error:", error);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
