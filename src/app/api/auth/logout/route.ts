import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cacheDelete } from "@/lib/cache";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("nova_session")?.value;
  if (token) {
    const userId = verifyToken(token);
    if (userId) cacheDelete(`auth:${userId}`);
  }
  
  cookieStore.delete("nova_session");
  return NextResponse.json({ success: true });
}
