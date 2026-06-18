import { ensureDb, Chat } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  await ensureDb();
  try {
    const chats = await Chat.find().sort({ updatedAt: -1 }).lean();
    
    // Map _id to id for client compatibility
    const formattedChats = chats.map(chat => ({
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
    const { personality = "nova" } = await req.json();
    
    const newChat = await Chat.create({
      title: "new chat",
      personality,
    });

    const chatData = newChat.toObject();
    
    return NextResponse.json({
      chat: {
        ...chatData,
        id: chatData._id.toString(),
        _id: undefined,
        __v: undefined
      }
    });
  } catch (error: any) {
    console.error("DB create chat:", error);
    return NextResponse.json({ error: "failed to create chat" }, { status: 500 });
  }
}
