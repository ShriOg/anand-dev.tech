import { ensureDb, Chat, Message } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb();
  
  const { id } = await params;
  
  try {
    const userId = req.headers.get("x-user-id");
    const { title } = await req.json();
    
    if (!title || !id || !userId) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    const chat = await Chat.findOne({ _id: id, userId });
    if (!chat) {
      return NextResponse.json({ error: "not found or forbidden" }, { status: 403 });
    }

    await Chat.findByIdAndUpdate(id, {
      title: title.slice(0, 80),
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DB rename:", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb();
  
  const { id } = await params;

  try {
    const userId = req.headers.get("x-user-id");
    if (!id || !userId) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    const chat = await Chat.findOne({ _id: id, userId });
    if (!chat) {
      return NextResponse.json({ error: "not found or forbidden" }, { status: 403 });
    }

    // Delete associated messages first
    await Message.deleteMany({ chatId: id });
    await Chat.findByIdAndDelete(id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DB delete:", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
