import { ensureDb, User } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

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

    return NextResponse.json({
      userId: user._id.toString(),
      username: user.username,
      name: user.name ?? null,
      gender: user.gender ?? null,
      onboardingCompleted: user.onboardingCompleted ?? false,
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
