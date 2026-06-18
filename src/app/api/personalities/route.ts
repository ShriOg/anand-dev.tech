import { ensureDb, CustomPersonality, Chat, Message } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await ensureDb();
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ personalities: [] });

    const personalities = await CustomPersonality.find({ userId }).sort({ createdAt: 1 }).lean();
    const formatted = (personalities as any[]).map((p: any) => ({
      ...p,
      _id: undefined,
      __v: undefined,
    }));

    return NextResponse.json({ personalities: formatted });
  } catch (error: any) {
    console.error("GET personalities error:", error);
    return NextResponse.json({ personalities: [] });
  }
}

export async function POST(req: Request) {
  await ensureDb();
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Missing x-user-id header" }, { status: 400 });

    const { name, emoji, prompt } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (name.trim().length > 20) {
      return NextResponse.json({ error: "Name must be 20 characters or less" }, { status: 400 });
    }
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (prompt.trim().length > 1000) {
      return NextResponse.json({ error: "Prompt must be 1000 characters or less" }, { status: 400 });
    }

    // Generate a simple unique id
    const { nanoid } = await import("nanoid");
    const id = `custom_${nanoid(10)}`;

    const personality = await CustomPersonality.create({
      userId,
      id,
      name: name.trim(),
      emoji: (emoji || "✨").trim().slice(0, 4),
      prompt: prompt.trim(),
    });

    const p = personality.toObject() as any;
    return NextResponse.json({
      personality: {
        ...p,
        _id: undefined,
        __v: undefined,
      }
    });
  } catch (error: any) {
    console.error("POST personality error:", error);
    return NextResponse.json({ error: "Failed to create personality" }, { status: 500 });
  }
}
