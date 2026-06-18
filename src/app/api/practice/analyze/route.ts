import { ensureDb, Person } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await ensureDb();

  try {
    const {
      messages = [],
      scenario,
      personId
    } = await req.json();

    let name = "Someone";
    let rel = "person";

    if (personId) {
      const person = await Person.findOne({ id: personId }).lean() as any;
      if (person) {
        name = person.name;
        rel = person.relationship;
      }
    }

    const conversationText = messages.map((m: any) => `${m.role === 'user' ? 'User' : name}: ${m.content}`).join("\n");

    const systemPrompt = `
You are an expert communication coach and relationship analyst.
The user just roleplayed a conversation with ${name} (Relationship: ${rel}).
Scenario: ${scenario}

Here is the transcript:
${conversationText}

Analyze this conversation honestly. Be specific. Do not soften things to protect the user's feelings. If they handled it badly, say so. Do not use generic praise.

You must return ONLY a valid JSON object matching this exact schema:
{
  "overallRead": "string - a vibe read, e.g. 'This went okay', 'You're trying but missing the point', 'This would have hurt them', 'You handled this really well'",
  "didWell": ["string - specific bullet points on what they did well based on actual messages"],
  "landedWrong": [
    {
      "quote": "string - exact quote from user",
      "reason": "string - why it landed badly, e.g. tone-deaf, dismissive, aggressive"
    }
  ],
  "patterns": ["string - hidden patterns they keep doing across messages e.g. 'You apologize but then immediately justify yourself'"],
  "theirPerspective": "string - paragraph from ${name}'s perspective e.g. 'When you said X, they probably felt Y because...'",
  "unsaidThing": "string - what the user actually wants to say but keeps avoiding"
}

Respond ONLY with valid JSON. Do NOT wrap it in markdown block quotes like \`\`\`json.
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
          { role: "system", content: systemPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`Nvidia API error: ${response.statusText}`);
    }

    const data = await response.json();
    let text = data.choices[0].message.content.trim();
    if (text.startsWith("```json")) {
      text = text.slice(7, -3).trim();
    } else if (text.startsWith("```")) {
      text = text.slice(3, -3).trim();
    }

    const analysis = JSON.parse(text);
    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error("Practice Analyze API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze" }, { status: 500 });
  }
}
