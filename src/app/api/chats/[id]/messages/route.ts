import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { ensureDb, Message, Chat } from "@/lib/db";
import { NextResponse } from "next/server";
import { cacheGet, cacheSet, cacheDeletePrefix } from "@/lib/cache";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb();
  
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ messages: [] });
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nova_session")?.value;
    const userId = token ? verifyToken(token) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!userId) return NextResponse.json({ messages: [] });

    const cacheKey = `messages:${id}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      return NextResponse.json({ messages: cached }, {
        headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' }
      });
    }

    const chat = await Chat.findOne({ _id: id, userId });
    if (!chat) return NextResponse.json({ error: "not found or forbidden" }, { status: 403 });

    const messages = await Message.find({ chatId: id }).sort({ createdAt: 1 }).lean();
    
    // Format to match what client expects: { role, content, createdAt }
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt
    }));

    cacheSet(cacheKey, formattedMessages, 30000);

    return NextResponse.json({ messages: formattedMessages }, {
      headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' }
    });
  } catch (error: any) {
    console.error("DB messages:", error);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb();
  
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nova_session")?.value;
    const userId = token ? verifyToken(token) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!userId) return NextResponse.json({ error: "Missing x-user-id header" }, { status: 400 });

    const chat = await Chat.findOne({ _id: id, userId });
    if (!chat) return NextResponse.json({ error: "not found or forbidden" }, { status: 403 });

    const { messages = [] } = await req.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const validMessages = messages.filter((m: any) => m.content !== null && m.content !== undefined);

    // Insert new valid messages (replace existing to avoid duplicates, since frontend sends full list)
    const toInsert = validMessages.map((m: any) => ({
      chatId: id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt || new Date()
    }));

    if (toInsert.length > 0) {
      await Message.deleteMany({ chatId: id });
      await Message.insertMany(toInsert);
    }
    
    // Update chat timestamp
    await Chat.findByIdAndUpdate(id, { updatedAt: new Date() });

    cacheDeletePrefix(`messages:${id}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DB save messages:", error);
    return NextResponse.json({ error: "failed to save" }, { status: 500 });
  }
}
