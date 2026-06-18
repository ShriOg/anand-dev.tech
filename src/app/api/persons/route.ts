import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { ensureDb, Person } from "@/lib/db";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function GET(req: Request) {
  await ensureDb();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nova_session")?.value;
    const userId = token ? verifyToken(token) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!userId) return NextResponse.json({ persons: [] });
    const persons = await Person.find({ userId }).sort({ createdAt: 1 }).lean();
    return NextResponse.json({
      persons: persons.map((p: any) => ({
        id: p.id, name: p.name, emoji: p.emoji,
        gender: p.gender, personality: p.personality,
        relationship: p.relationship, language: p.language,
        createdAt: p.createdAt,
      }))
    });
  } catch (e: any) {
    return NextResponse.json({ persons: [] });
  }
}

export async function POST(req: Request) {
  await ensureDb();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nova_session")?.value;
    const userId = token ? verifyToken(token) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, emoji, gender, personality, relationship, language, avatarBase64 } = body;

    if (!name || !gender || !personality || !relationship) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const id = nanoid(12);
    const person = await Person.create({
      userId, id,
      name: name.trim(),
      emoji: emoji ? emoji.trim().slice(0, 4) : "🧑",
      avatar: avatarBase64 || null,
      gender, personality, relationship, language,
    });

    return NextResponse.json({
      person: {
        id: person.id, name: person.name, emoji: person.emoji,
        avatar: person.avatar,
        gender: person.gender, personality: person.personality,
        relationship: person.relationship, language: person.language,
        createdAt: person.createdAt,
      }
    }, { status: 201 });
  } catch (e: any) {
    console.error("Create person error:", e);
    return NextResponse.json({ error: "Failed to create person" }, { status: 500 });
  }
}
