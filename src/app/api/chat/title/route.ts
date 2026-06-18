import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ title: "New Chat" });
    }

    const systemPrompt = `You are an AI that generates a very short, cute, and concise title for a chat based on the first message sent by the user. 
Rules:
- Max 3-4 words.
- Mostly lowercase.
- You can include one emoji if it fits.
- NEVER include quotes around the title.
- Do not output any other text except the title itself.
- Examples: "missing you 🥺", "study time 📚", "venting session", "literally dying 😂"`;

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
          { role: "user", content: `First message: "${message}"` }
        ],
        temperature: 0.5,
        max_tokens: 15
      })
    });

    if (!response.ok) {
      return NextResponse.json({ title: message.slice(0, 30) });
    }

    const data = await response.json();
    let title = data.choices?.[0]?.message?.content?.trim() || message.slice(0, 30);
    
    // Clean up quotes if the AI adds them despite instructions
    if (title.startsWith('"') && title.endsWith('"')) {
      title = title.slice(1, -1);
    }

    return NextResponse.json({ title });
  } catch (error: any) {
    console.error("Title Generation API Error:", error);
    return NextResponse.json({ title: "New Chat" });
  }
}
