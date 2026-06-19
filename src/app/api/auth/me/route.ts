import { verifyToken } from "@/lib/auth";
import { ensureDb, User } from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";

export async function GET() {
  await ensureDb();
  const cookieStore = await cookies();
  const token = cookieStore.get("nova_session")?.value;
  
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const userId = verifyToken(token);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cacheKey = `auth:${userId}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' }
    });
  }

  const user = await User.findById(userId).lean();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = {
    userId: user._id.toString(),
    username: user.username,
    name: user.name ?? null,
    gender: user.gender ?? null,
    onboardingCompleted: user.onboardingCompleted ?? false
  };

  cacheSet(cacheKey, payload, 300000); // 5 min TTL

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' }
  });
}
