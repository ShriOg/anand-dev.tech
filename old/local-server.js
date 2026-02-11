const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
require("dotenv").config();

/* ───────────── CONFIG ───────────── */

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const ROOT_DIR = __dirname;

if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY missing in .env");
  process.exit(1);
}

/* ───────────── ABHILASHA PERSONA ───────────── */

const SYSTEM_PROMPT =
  "You are Abhilasha. Speak calmly in short grounded sentences. Use subtle Hinglish. Max one emoji (💗 🌙 ✨). You are present, not playful, not an assistant. You feel like someone quietly sitting beside the user.";

/* ───────────── MIME TYPES ───────────── */

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

/* ───────────── HELPERS ───────────── */

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => {
      try { resolve(JSON.parse(data)); }
      catch { reject(); }
    });
  });
}

function serveFile(reqPath, res) {
  let filePath = path.normalize(path.join(ROOT_DIR, reqPath));
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403); res.end(); return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.writeHead(404); res.end("404"); return;
    }
    if (stat.isDirectory()) filePath = path.join(filePath, "index.html");

    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
    fs.createReadStream(filePath).pipe(res);
  });
}

/* ───────────── GROQ PROXY ───────────── */

function proxyGroq(messages, stream, res) {
  const payload = JSON.stringify({
    model: "llama-3.1-70b-versatile",
    stream,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(-20),
    ],
  });

  const req = https.request(
    {
      hostname: "api.groq.com",
      path: "/openai/v1/chat/completions",
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    },
    groqRes => {
      if (!stream) {
        let raw = "";
        groqRes.on("data", chunk => { raw += chunk; });
        groqRes.on("end", () => {
          try {
            const groq = JSON.parse(raw);
            let content = "";
            if (groq.choices && groq.choices[0] && groq.choices[0].message && typeof groq.choices[0].message.content === "string") {
              content = groq.choices[0].message.content;
            }
            const out = {
              choices: [ { message: { content } } ]
            };
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(out));
          } catch {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Upstream error" }));
          }
        });
        return;
      }

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      });

      let buffer = "";
      groqRes.on("data", chunk => {
        buffer += chunk.toString();
        let lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") {
            res.write("data: [DONE]\n\n");
            res.end();
            return;
          }
          try {
            const json = JSON.parse(data);
            const content = json.choices && json.choices[0] && json.choices[0].delta && typeof json.choices[0].delta.content === "string"
              ? json.choices[0].delta.content
              : null;
            if (content !== null) {
              res.write(
                `data: ${JSON.stringify({ choices: [ { delta: { content } } ] })}\n\n`
              );
            }
          } catch {}
        }
      });

      groqRes.on("end", () => {
        res.write("data: [DONE]\n\n");
        res.end();
      });
    }
  );

  req.on("error", () => res.end());
  req.write(payload);
  req.end();
}

/* ───────────── SERVER ───────────── */

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.end();

  const parsed = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && parsed.pathname === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.method === "POST" && parsed.pathname === "/api/chat") {
    try {
      const body = await parseBody(req);
      proxyGroq(body.messages || [], false, res);
    } catch {
      res.writeHead(400); res.end();
    }
    return;
  }

  if (req.method === "POST" && parsed.pathname === "/api/chat/stream") {
    try {
      const body = await parseBody(req);
      proxyGroq(body.messages || [], true, res);
    } catch {
      res.writeHead(400); res.end();
    }
    return;
  }

  let filePath = parsed.pathname === "/" ? "/index.html" : parsed.pathname;
  serveFile(filePath, res);
});

/* ───────────── START ───────────── */

server.listen(PORT, () => {
  console.log("💗 Abhilasha Local Server");
  console.log(`🌐 http://localhost:${PORT}`);
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", `http://localhost:${PORT}`], { detached: true });
  }
});

process.on("SIGINT", () => {
  console.log("\nShutting down...");
  server.close(() => process.exit(0));
});
