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

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) {
      // Return same message for security — don't reveal whether username exists
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const response = NextResponse.json({
      userId: user._id.toString(),
      username: user.username,
      name: user.name ?? null,
      gender: user.gender ?? null,
      onboardingCompleted: user.onboardingCompleted ?? false,
      // Companion settings
      companionName: user.companionName ?? null,
      companionPhoto: user.companionPhoto ?? null,
      personality: user.personality ?? "nova",
      language: user.language ?? "english",
      relationship: user.relationship ?? "girlfriend",
    });
    
    const cookieStore = await cookies();
    cookieStore.set("nova_session", signToken(user._id.toString()), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30
    });
    
    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
