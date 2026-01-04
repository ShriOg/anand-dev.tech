import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY is missing");
  process.exit(1);
}

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: "2mb" }));

app.post("/api/chat", async (req, res) => {
  const payload = {
    model: req.body.model || "llama-3.1-70b-versatile",
    messages: req.body.messages,
    temperature: req.body.temperature,
    stream: req.body.stream === true,
    ...(req.body.max_tokens !== undefined
      ? { max_tokens: req.body.max_tokens }
      : {})
  };

  try {
    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    // STREAMING MODE
    if (payload.stream) {
      res.status(groqRes.status);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      if (!groqRes.body) {
        res.end();
        return;
      }

      groqRes.body.on("data", chunk => {
        res.write(chunk);
      });

      groqRes.body.on("end", () => {
        res.end();
      });

      groqRes.body.on("error", () => {
        res.end();
      });

      return;
    }

    // NON-STREAMING MODE
    res.status(groqRes.status);
    groqRes.body.pipe(res);

  } catch (err) {
    res.status(500).json({
      error: "Groq proxy failure",
      message: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log("💗 ABHILASHA AI GROQ SERVER");
  console.log(`🟢 Server: http://localhost:${PORT}`);
  console.log(`🌐 Frontend allowed: ${FRONTEND_ORIGIN}`);
});
