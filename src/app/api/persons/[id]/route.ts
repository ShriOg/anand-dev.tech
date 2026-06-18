import { ensureDb, Person, Chat, Message } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDb();
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const person = await Person.findOne({ id, userId });
    if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Cascade: delete chat + messages
    const chat = await Chat.findOne({ userId, personId: id });
    if (chat) {
      await Message.deleteMany({ chatId: chat._id });
      await Chat.deleteOne({ _id: chat._id });
    }

    await Person.deleteOne({ id, userId });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Delete person error:", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
