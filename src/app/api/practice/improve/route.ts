import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { ensureDb, Person } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await ensureDb();

  const cookieStore = await cookies();
    const token = cookieStore.get("nova_session")?.value;
    const userId = token ? verifyToken(token) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const {
      messages = [],
      analysis,
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

    const systemPrompt = `
You are an expert communication coach.
Based on the user's roleplay conversation and your previous analysis, help the user improve.
Relationship: ${rel}
Other Person's Name: ${name}

Previous Analysis JSON:
${JSON.stringify(analysis, null, 2)}

User Messages to rewrite: find the 2-3 worst messages from the user in the context and rewrite them.

You must return ONLY a valid JSON object matching this exact schema:
{
  "rewrites": [
    {
      "original": "string - the exact bad message the user sent",
      "rewritten": "string - a better version",
      "why": "string - one line explaining why the rewrite works better"
    }
  ],
  "suggestedOpener": "string - a suggested opening message or conversation starter for the real situation, based on everything. Not a script, a starting point.",
  "practicePrompts": [
    {
      "label": "string - e.g. 'Try this: they bring it up first and they're upset'",
      "scenario": "string - the situation input",
      "mood": "string - one of: neutral, upset, happy, distant, confused",
      "stakes": "string - one of: low, medium, high, very high"
    }
  ]
}

Return EXACTLY 3 practice prompts.
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
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is the conversation:\n${JSON.stringify(messages)}` }
        ],
        temperature: 0.3,
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

    const improveData = JSON.parse(text);
    return NextResponse.json(improveData);

  } catch (error: any) {
    console.error("Practice Improve API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to improve" }, { status: 500 });
  }
}
