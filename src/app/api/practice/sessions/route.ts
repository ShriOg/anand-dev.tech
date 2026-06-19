import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { ensureDb, PracticeSession } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await ensureDb();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nova_session")?.value;
    const userId = token ? verifyToken(token) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const personId = searchParams.get("personId");
    if (!personId) return NextResponse.json({ error: "personId required" }, { status: 400 });

    const sessions = await PracticeSession.find({ userId, personId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    console.log("sessions query:", userId, personId, "found:", sessions.length);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("GET practice sessions:", error);
    return NextResponse.json({ error: "failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await ensureDb();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nova_session")?.value;
    const userId = token ? verifyToken(token) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { personId, scenario, mood, stakes } = await req.json();
    if (!personId || !scenario || !mood || !stakes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await PracticeSession.create({
      userId,
      personId,
      scenario,
      mood,
      stakes,
      messages: []
    });

    return NextResponse.json({ sessionId: session._id });
  } catch (error) {
    console.error("POST practice sessions:", error);
    return NextResponse.json({ error: "failed to create session" }, { status: 500 });
  }
}
