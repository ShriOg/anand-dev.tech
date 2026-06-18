import { ensureDb, Chat } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await ensureDb();
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ chats: [] });

    const chats = await Chat.find({ userId, deleted: { $ne: true } }).sort({ updatedAt: -1 }).lean();
    
    // Map _id to id for client compatibility
    const formattedChats = chats.map((chat: any) => ({
      ...chat,
      id: chat._id.toString(),
      _id: undefined,
      __v: undefined
    }));

    return NextResponse.json({ chats: formattedChats });
  } catch (error: any) {
    console.error("DB chats error:", error);
    return NextResponse.json({ chats: [] });
  }
}

export async function POST(req: Request) {
  await ensureDb();
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Missing x-user-id header" }, { status: 400 });

    const { 
      personality = "nova",
      companionName,
      companionPhoto,
      relationshipType,
      language
    } = await req.json();
    
    // Upsert: find-or-create one chat per personality per user
    const chat = await Chat.findOneAndUpdate(
      { userId, personality },
      {
        $setOnInsert: {
          title: companionName ? `Chat with ${companionName}` : `${personality} chat`,
          personality,
          companionName,
          companionPhoto,
          relationshipType,
          language,
          userId,
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean() as any;

    return NextResponse.json({
      chat: {
        ...chat,
        id: chat._id.toString(),
        _id: undefined,
        __v: undefined
      }
    });
  } catch (error: any) {
    console.error("DB create chat:", error);
    return NextResponse.json({ error: "failed to create chat" }, { status: 500 });
  }
}
