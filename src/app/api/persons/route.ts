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
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      name, emoji = "🧑", gender = "they",
      personality = "nova", relationship = "bestfriend", language = "english"
    } = await req.json();

    if (!name || !name.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (name.trim().length > 20) return NextResponse.json({ error: "Name too long (max 20)" }, { status: 400 });

    const id = nanoid(12);
    const person = await Person.create({
      userId, id,
      name: name.trim(),
      emoji: emoji.trim().slice(0, 4) || "🧑",
      gender, personality, relationship, language,
    });

    return NextResponse.json({
      person: {
        id: person.id, name: person.name, emoji: person.emoji,
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
