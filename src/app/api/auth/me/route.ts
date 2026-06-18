import { verifyToken } from "@/lib/auth";
import { ensureDb, User } from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  await ensureDb();
  const cookieStore = await cookies();
  const token = cookieStore.get("nova_session")?.value;
  
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const userId = verifyToken(token);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await User.findById(userId).lean();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    userId: user._id.toString(),
    username: user.username,
    name: user.name ?? null,
    gender: user.gender ?? null,
    onboardingCompleted: user.onboardingCompleted ?? false
  });
}
