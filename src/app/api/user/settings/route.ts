import { ensureDb, User } from "@/lib/db";
import { NextResponse } from "next/server";

// GET — fetch companion settings for the logged-in user
export async function GET(req: Request) {
  try {
    await ensureDb();
  } catch (err: any) {
    return NextResponse.json({ error: "Database not available." }, { status: 503 });
  }

  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await User.findById(userId).select(
      "companionName companionPhoto personality language relationship name gender onboardingCompleted"
    );
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      companionName: user.companionName ?? null,
      companionPhoto: user.companionPhoto ?? null,
      personality: user.personality ?? "nova",
      language: user.language ?? "english",
      relationship: user.relationship ?? "girlfriend",
      name: user.name ?? null,
      gender: user.gender ?? null,
      onboardingCompleted: user.onboardingCompleted ?? false,
    });
  } catch (err: any) {
    console.error("GET /api/user/settings error:", err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT — save companion settings
export async function PUT(req: Request) {
  try {
    await ensureDb();
  } catch (err: any) {
    return NextResponse.json({ error: "Database not available." }, { status: 503 });
  }

  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Only allow known fields to be updated
    const allowed = ["companionName", "companionPhoto", "personality", "language", "relationship"];
    const update: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(userId, update, { new: true });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PUT /api/user/settings error:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
