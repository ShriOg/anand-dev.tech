import { ensureDb, User } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await ensureDb();
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, gender } = await req.json();

    if (!name || !gender) {
      return NextResponse.json({ error: "Name and gender are required" }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        name,
        gender,
        onboardingCompleted: true
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: { name: user.name, gender: user.gender, onboardingCompleted: user.onboardingCompleted } });
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}
