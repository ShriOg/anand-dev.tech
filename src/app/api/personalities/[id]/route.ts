import { ensureDb, CustomPersonality, Chat, Message } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDb();
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Missing x-user-id header" }, { status: 400 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing personality id" }, { status: 400 });

    // Verify ownership
    const personality = await CustomPersonality.findOne({ id, userId });
    if (!personality) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete the personality
    await CustomPersonality.deleteOne({ id, userId });

    // Also delete the associated chat and its messages
    const chat = await Chat.findOne({ userId, personality: id });
    if (chat) {
      await Message.deleteMany({ chatId: chat._id });
      await Chat.deleteOne({ _id: chat._id });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE personality error:", error);
    return NextResponse.json({ error: "Failed to delete personality" }, { status: 500 });
  }
}
