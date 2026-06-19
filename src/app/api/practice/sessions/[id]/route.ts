import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { ensureDb, PracticeSession } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb();
  const { id } = await params;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nova_session")?.value;
    const userId = token ? verifyToken(token) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await PracticeSession.findOne({ _id: id, userId }).lean();
    if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });

    return NextResponse.json({ session });
  } catch (error) {
    console.error("GET practice session:", error);
    return NextResponse.json({ error: "failed to fetch session" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb();
  const { id } = await params;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nova_session")?.value;
    const userId = token ? verifyToken(token) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const updates = await req.json();
    const allowedFields = ["messages", "analysis", "improve"];
    
    const updateQuery: any = { updatedAt: new Date() };
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateQuery[field] = updates[field];
      }
    }

    const session = await PracticeSession.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateQuery },
      { new: true }
    ).lean();

    if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("PATCH practice session:", error);
    return NextResponse.json({ error: "failed to update session" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb();
  const { id } = await params;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nova_session")?.value;
    const userId = token ? verifyToken(token) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await PracticeSession.findOneAndDelete({ _id: id, userId });
    if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE practice session:", error);
    return NextResponse.json({ error: "failed to delete session" }, { status: 500 });
  }
}
