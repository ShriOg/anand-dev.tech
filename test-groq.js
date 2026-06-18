const fetch = require('node-fetch');

async function run() {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer undefined`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "hello" },
          { role: "user", content: "hello" }
        ],
        stream: true,
        temperature: 0.85,
        max_tokens: 1024
      })
    });
    
    console.log(response.status, response.statusText);
    const text = await response.text();
    console.log(text.substring(0, 100));
}
run();
