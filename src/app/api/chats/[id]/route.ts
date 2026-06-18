import { ensureDb, Chat, Message } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb();
  
  const { id } = await params;
  
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    
    if (!id || !userId) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    const chat = await Chat.findOne({ _id: id, userId });
    if (!chat) {
      return NextResponse.json({ error: "not found or forbidden" }, { status: 403 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (body.title) updateData.title = body.title.slice(0, 80);
    if (body.companionName) updateData.companionName = body.companionName;
    if (body.companionPhoto !== undefined) updateData.companionPhoto = body.companionPhoto;
    if (body.relationshipType) updateData.relationshipType = body.relationshipType;
    if (body.language) updateData.language = body.language;

    await Chat.findByIdAndUpdate(id, updateData);

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

    // Soft delete chat, leave messages intact
    await Chat.findByIdAndUpdate(id, {
      deleted: true,
      deletedAt: new Date(),
      updatedAt: new Date()
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DB delete:", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
