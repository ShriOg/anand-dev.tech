import { ensureDb, Message, Chat } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb();
  
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ messages: [] });
  }

  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ messages: [] });

    const chat = await Chat.findOne({ _id: id, userId });
    if (!chat) return NextResponse.json({ error: "not found or forbidden" }, { status: 403 });

    const messages = await Message.find({ chatId: id }).sort({ createdAt: 1 }).lean();
    
    // Format to match what client expects: { role, content }
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    return NextResponse.json({ messages: formattedMessages });
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
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Missing x-user-id header" }, { status: 400 });

    const chat = await Chat.findOne({ _id: id, userId });
    if (!chat) return NextResponse.json({ error: "not found or forbidden" }, { status: 403 });

    const { messages = [] } = await req.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Delete existing messages for this chat
    await Message.deleteMany({ chatId: id });

    const validMessages = messages.filter((m: any) => m.content && m.content.trim() !== '');

    // Insert new valid messages
    const toInsert = validMessages.map((m: any) => ({
      chatId: id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt || new Date()
    }));

    if (toInsert.length > 0) {
      await Message.insertMany(toInsert);
    }
    
    // Update chat timestamp
    await Chat.findByIdAndUpdate(id, { updatedAt: new Date() });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DB save messages:", error);
    return NextResponse.json({ error: "failed to save" }, { status: 500 });
  }
}
