import { ensureDb, User } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    await ensureDb();
  } catch (err: any) {
    console.error("DB connection error:", err.message);
    return NextResponse.json(
      { error: "Database not available. Please check server configuration." },
      { status: 503 }
    );
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }
    if (username.trim().length < 3 || username.trim().length > 30) {
      return NextResponse.json({ error: "Username must be 3–30 characters" }, { status: 400 });
    }
    if (!/^[a-z0-9_]+$/i.test(username.trim())) {
      return NextResponse.json({ error: "Username may only contain letters, numbers, and underscores" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await User.findOne({ username: username.trim().toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.trim().toLowerCase(),
      passwordHash,
    });

    const response = NextResponse.json({
      userId: user._id.toString(),
      username: user.username,
      name: user.name ?? null,
      gender: user.gender ?? null,
      onboardingCompleted: user.onboardingCompleted ?? false,
    }, { status: 201 });
    
    const cookieStore = await cookies();
    cookieStore.set("nova_session", signToken(user._id.toString()), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30
    });
    
    return response;
  } catch (err: any) {
    // Mongoose duplicate key error
    if (err.code === 11000) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
