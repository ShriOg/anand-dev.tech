import { ensureDb, Chat, Message } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb();
  
  const { id } = await params;
  
  try {
    const { title } = await req.json();
    
    if (!title || !id) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
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

  if (!id) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  try {
    // Delete associated messages first
    await Message.deleteMany({ chatId: id });
    await Chat.findByIdAndDelete(id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DB delete:", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
