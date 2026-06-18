import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { ensureDb, Person } from "@/lib/db";
import { NextResponse } from "next/server";

const RELATIONSHIP_MODIFIERS: Record<string, string> = {
  girlfriend: `You are their girlfriend. You have a history, feelings, and expectations. You react authentically.`,
  bestfriend: `You are their best friend. You know them better than anyone, but you still have boundaries.`,
  classmate: `You are a classmate. You know them casually but not deeply. You might be polite or awkward.`,
  crush: `You are their crush. You might not know how they feel, or maybe you suspect it. You react realistically based on the mood.`,
  situationship: `You are in a situationship with them. Things are complicated, unclear, and sometimes tense.`
};

export async function POST(req: Request) {
  await ensureDb();

  const cookieStore = await cookies();
    const token = cookieStore.get("nova_session")?.value;
    const userId = token ? verifyToken(token) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const {
      messages = [],
      scenario,
      otherPersonMood,
      stakes,
      personId
    } = await req.json();

    let name = "Someone";
    let rel = "bestfriend";

    if (personId) {
      const person = await Person.findOne({ id: personId }).lean() as any;
      if (person) {
        name = person.name;
        rel = person.relationship;
      }
    }

    const relMod = RELATIONSHIP_MODIFIERS[rel] || RELATIONSHIP_MODIFIERS.bestfriend;

    const systemPrompt = `
You are roleplaying as ${name} in a practice conversation. 
This is a PRACTICE session for the user to try out a real-life conversation.
You must play the role of ${name} authentically, NOT perfectly. Do not be artificially nice just because it's practice.
If the user says something hurtful, clumsy, or tone-deaf, react like a real person would (get upset, go quiet, deflect, etc.).
Do NOT break character. Do NOT say "as an AI".

Context for the roleplay:
Relationship: ${relMod}
Scenario: ${scenario}
Your Mood: ${otherPersonMood}
Stakes of the conversation: ${stakes}

React realistically to what the user says. Keep your responses natural, proportional, and human.
`.trim();

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-20)
        ],
        stream: true,
        temperature: 0.8,
        top_p: 0.85,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Nvidia API error:", errorText);
      throw new Error(`Nvidia API error: ${response.statusText}`);
    }

    if (!response.body) throw new Error("No response body from Nvidia API");

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    (async () => {
      const reader = response.body!.getReader();
      let buf = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") {
              await writer.write(encoder.encode("data: [DONE]\n\n"));
              return;
            }
            try {
              const obj = JSON.parse(payload);
              const text = obj.choices?.[0]?.delta?.content;
              if (text) {
                await writer.write(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            } catch { }
          }
        }
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("Practice Chat API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch response" }, { status: 500 });
  }
}
