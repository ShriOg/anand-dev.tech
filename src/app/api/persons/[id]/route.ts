import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { ensureDb, Person, Chat, Message } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDb();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nova_session")?.value;
    const userId = token ? verifyToken(token) : null;
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDb();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nova_session")?.value;
    const userId = token ? verifyToken(token) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, emoji, gender, relationship, language, avatarBase64 } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (emoji !== undefined) updateData.emoji = emoji;
    if (gender !== undefined) updateData.gender = gender;
    if (relationship !== undefined) updateData.relationship = relationship;
    if (language !== undefined) updateData.language = language;
    if (avatarBase64 !== undefined) updateData.avatar = avatarBase64;

    const { id } = await params;
    const person = await Person.findOneAndUpdate(
      { id, userId },
      { $set: updateData },
      { new: true }
    );
    if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      person: {
        id: person.id, name: person.name, emoji: person.emoji, avatar: person.avatar,
        gender: person.gender, personality: person.personality,
        relationship: person.relationship, language: person.language,
        createdAt: person.createdAt,
      }
    });
  } catch (e: any) {
    console.error("Patch person error:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
