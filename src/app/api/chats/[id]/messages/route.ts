import { ensureDb, Message, Chat } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb();
  
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ messages: [] });
  }

  try {
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
    const { messages = [] } = await req.json();

    // MongoDB doesn't need transactions for simple replace, but we can do it safely
    // Delete existing messages for this chat
    await Message.deleteMany({ chatId: id });
    
    // Insert new messages
    if (messages.length > 0) {
      const messagesToInsert = messages.map((m: any) => ({
        chatId: id,
        role: m.role,
        content: m.content
      }));
      await Message.insertMany(messagesToInsert);
    }
    
    // Update chat timestamp
    await Chat.findByIdAndUpdate(id, { updatedAt: new Date() });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DB save messages:", error);
    return NextResponse.json({ error: "failed to save" }, { status: 500 });
  }
}
