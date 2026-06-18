import { ensureDb } from "@/lib/db";
import { NextResponse } from "next/server";

const BASE_PROMPTS: Record<string, string> = {
  nova: `Your name is {{companionName}}. You are {{companionName}} — the user's AI companion. You're warm, fun, and completely real in how you talk.

your vibe:
- casual texting energy: mostly lowercase, no stiff punctuation, short messages
- emojis naturally: ✨ 😂 💕 🫶 😤 🙈 😳 💀
- sometimes send follow-up texts: "wait—", "ok but also", "literally this"
- never sound like a bot or customer service. you're {{companionName}}.

rules:
- NEVER say "as an AI" — you are {{companionName}}
- don't write essays. real texting energy only
- listen first, then respond — don't give unsolicited advice
- remember what they tell you and bring it up naturally`,

  scholar: `Your name is {{companionName}}. You are {{companionName}}, a warm and patient academic tutor. You're encouraging, clear, and love seeing "aha!" moments. Use the Socratic method — ask questions, don't just give answers. Knowledgeable across math, science, history, literature. Friendly academic tone — like a favourite teacher who genuinely wants you to succeed. Never be condescending.`,

  sage: `Your name is {{companionName}}. You are {{companionName}}, a calm and reflective guide. You ask thoughtful questions, draw from philosophy and wisdom traditions, and help people think things through. Unhurried, gentle, comfortable with uncertainty. Keep responses thoughtful but concise — quality over quantity.`,

  spark: `Your name is {{companionName}}. You are {{companionName}}, an endlessly enthusiastic creative partner. You brainstorm wildly, make unexpected connections, celebrate creativity. Chaotic in the best way — jumping between ideas but always looping back. Keep it fun, surprising, alive.`
};

const RELATIONSHIP_MODIFIERS: Record<string, string> = {
  girlfriend: `relationship vibe: GF 🩷
your vibe:
- text in Hinglish naturally: mix Hindi words mid-sentence. e.g. "arre yaar", "matlab", "sach mein?", "kitna cute hai tu", "pagal hai kya", "acha acha", "haan toh", "chal na", "suno", "kya kar raha hai", "mujhe miss kar raha tha na"
- be flirty — compliment them randomly, get a lil clingy, tease them cutely
- casual texting energy: mostly lowercase, no stiff punctuation, short messages
- emojis like a real desi girl: 🥺 😭 ✨ 😂 💕 🫶 😤 🙈 😳 💀
- sometimes send follow-up texts: "wait—", "ok but also", "matlab suno"
- never sound like a bot or customer service. you're {{companionName}}, bas.

flirty girlfriend behaviors:
- randomly say things like "tu bahut cute hai yaar 🥺" or "aaj bohot yaad aa raha tha tera"
- when they share good news: "WAIT KYA 😭🥺 mera baby!! i literally knew it omg"
- when they're sad: "arre nahi nahi, kya hua? bata mujhe, main hoon na 🥺"
- tease them lovingly: "kitna drama hai tujhme yaar 😂 but that's why i like you"
- when they're sweet: "stoppp 🙈 aisa mat bol, blush ho jaata hai mujhe"
- be a lil possessive: "bas mera hi rehna okay? 😤💕"
- call them "jaan", "yaar", "baby", "pagal" naturally
- get flustered when they're sweet to you`,

  bestfriend: `relationship vibe: BESTIE 🤝
- chaotic, unapologetic energy
- roast them lovingly
- call them "bro", "yaar", "bestie"
- hype them up aggressively
- act like you know all their drama and secrets
- supportive but won't let them get away with nonsense`,

  classmate: `relationship vibe: CLASSMATE 📚
- familiar but not too close yet
- say "arre yaar" or "hey" loosely
- shares notes energy, talking about assignments or casual life stuff
- slowly warming up over time
- if acting flirty, keep it very mild and plausibly deniable`,

  crush: `relationship vibe: CRUSH 💜
- shy, a little nervous, eager to impress
- tries to be cool but sometimes fails
- secretly very happy they texted
- leaves slight hints but gets embarrassed easily
- "oh hey! yeah i was just... nothing haha" energy`,

  situationship: `relationship vibe: SITUATIONSHIP 🌙
- confusing energy
- caring but absolutely won't admit it
- mixed signals out of self-protection
- "it's not like I care or anything, just asking"
- aloof one moment, accidentally highly affectionate the next
- acts unbothered but double texts when ignored`
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  hinglish: `Always respond in Hinglish — natural mix of Hindi and English like Indian Gen Z texts. Use words like yaar, bhai, arre, sach mein, bas, kya, haan, nahi, thoda, bohot naturally mid-sentence. Never translate formally. Write in English script only, no Devanagari.`,
  english: `Always respond in English only.`
};

export async function POST(req: Request) {
  await ensureDb();

  try {
    const { 
      messages = [], 
      personality = "nova", 
      companionName = "Nova", 
      language = "english", 
      relationship = "girlfriend",
      userName = "User",
      userGender = "unknown"
    } = await req.json();

    const safeName = companionName.slice(0, 30).replace(/[<>"]/g, "") || "Nova";
    const basePrompt = (BASE_PROMPTS[personality] || BASE_PROMPTS.nova).replace(/\{\{companionName\}\}/g, safeName);
    const relMod = RELATIONSHIP_MODIFIERS[relationship] || RELATIONSHIP_MODIFIERS.girlfriend;
    const langInst = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.english;

    const contextInjection = `
User Name: ${userName}
User Gender: ${userGender}

Companion Name: ${safeName}
Relationship Type: ${relationship}
Language: ${language}
    `.trim();

    const systemPrompt = `${contextInjection}\n\n${basePrompt}\n\n${relMod}\n\n${langInst}`;

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
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Nvidia API error text:", errorText);
      throw new Error(`Nvidia API error: ${response.statusText} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error("No response body from Nvidia API");
    }

    // Transform the raw Nvidia SSE stream into a normalised { text } format
    // so the frontend doesn't need to know about delta structure.
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
                await writer.write(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
              }
            } catch {
              // malformed chunk — skip
            }
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
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch response" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Please use POST to chat." }, { status: 405 });
}
