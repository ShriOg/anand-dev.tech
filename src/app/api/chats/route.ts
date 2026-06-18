import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { ensureDb, Chat } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await ensureDb();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nova_session")?.value;
    const userId = token ? verifyToken(token) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!userId) return NextResponse.json({ chats: [] });

    const chats = await Chat.find({ userId, deleted: { $ne: true } })
      .sort({ updatedAt: -1 }).lean();

    const formattedChats = chats.map((chat: any) => ({
      ...chat,
      id: chat._id.toString(),
      _id: undefined,
      __v: undefined,
    }));

    return NextResponse.json({ chats: formattedChats });
  } catch (error: any) {
    return NextResponse.json({ chats: [] });
  }
}

export async function POST(req: Request) {
  await ensureDb();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nova_session")?.value;
    const userId = token ? verifyToken(token) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!userId) return NextResponse.json({ error: "Missing x-user-id header" }, { status: 400 });

    const { personId, title = "Chat" } = await req.json();

    if (!personId) return NextResponse.json({ error: "personId required" }, { status: 400 });

    // Upsert: one chat per person per user
    const chat = await Chat.findOneAndUpdate(
      { userId, personId },
      { $setOnInsert: { title, personId, userId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean() as any;

    return NextResponse.json({
      chat: { ...chat, id: chat._id.toString(), _id: undefined, __v: undefined }
    });
  } catch (error: any) {
    console.error("DB create chat:", error);
    return NextResponse.json({ error: "failed to create chat" }, { status: 500 });
  }
}
