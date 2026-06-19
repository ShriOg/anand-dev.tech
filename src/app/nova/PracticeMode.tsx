"use client";

import React, { useState, useRef, useEffect } from "react";
import { Avatar } from "./Avatar";

interface PracticeModeProps {
  personId: string;
  userId: string;
  activePerson: any;
  onClose: () => void;
}

type Mood = "neutral" | "upset" | "happy" | "distant" | "confused";
type Stakes = "low" | "medium" | "high" | "very high";

const MOOD_EMOJIS: Record<Mood, string> = {
  neutral: "😐", upset: "😤", happy: "😊", distant: "😶", confused: "😕"
};

export default function PracticeMode({ personId, userId: _userId, activePerson, onClose }: PracticeModeProps) {
  const [tab, setTab] = useState<"rehearse" | "analyze" | "improve">("rehearse");

  const [scenario, setScenario] = useState("");
  const [mood, setMood] = useState<Mood>("neutral");
  const [stakes, setStakes] = useState<Stakes>("medium");

  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");

  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [improve, setImprove] = useState<any>(null);
  const [isImproving, setIsImproving] = useState(false);

  // Persistence
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // inline impact analysis: msgIndex -> { loading, result }
  const [impactMap, setImpactMap] = useState<Record<number, { loading: boolean; result: any | null }>>({});

  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/practice/sessions?personId=${personId}`)
      .then(r => r.json())
      .then(d => { if (d.sessions) setSessions(d.sessions); })
      .catch(e => console.error("Failed to load sessions", e));
  }, [personId]);

  const scrollToBottom = (smooth = true) => {
    if (!chatRef.current) return;
    chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => { scrollToBottom(true); }, [messages, streamedText, tab]);

  const handleSend = async () => {
    if ((!inputValue.trim() && !streamedText) || isStreaming) return;
    const userText = inputValue.trim();
    setInputValue("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const newMsg = { role: "user", content: userText };
    const optimisticMessages = [...messages, newMsg];
    setMessages(optimisticMessages);
    setIsStreaming(true);
    setStreamedText("");

    let currentSessionId = sessionId;
    if (!currentSessionId) {
      try {
        const createRes = await fetch("/api/practice/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personId, scenario: scenario || "Untitled practice", mood, stakes })
        });
        const createData = await createRes.json();
        if (createData.sessionId) {
          currentSessionId = createData.sessionId;
          setSessionId(currentSessionId);
          setSessions(prev => [{ _id: currentSessionId, scenario: scenario || "Untitled practice", mood, stakes, createdAt: new Date() }, ...prev]);
        }
      } catch (e) {
        console.error("Failed to create session", e);
      }
    }

    let fullResponse = "";
    try {
      const res = await fetch("/api/practice/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: optimisticMessages, scenario, otherPersonMood: mood, stakes, personId })
      });
      if (!res.ok) throw new Error("Practice Chat API Error");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value).split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") break;
              try { const d = JSON.parse(payload); if (d.text) { fullResponse += d.text; setStreamedText(fullResponse); } } catch {}
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      const finalMsgs = [...optimisticMessages, { role: "assistant", content: fullResponse }];
      setMessages(finalMsgs);
      setStreamedText("");
      setIsStreaming(false);
      scrollToBottom();
      
      if (currentSessionId && fullResponse) {
        fetch(`/api/practice/sessions/${currentSessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: finalMsgs })
        }).catch(e => console.error("Failed to patch session", e));
      }
    }
  };

  const handleAnalyze = async () => {
    setTab("analyze");
    if (analysis || messages.length === 0) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/practice/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, scenario, personId })
      });
      const data = await res.json();
      setAnalysis(data);
      if (sessionId) {
        fetch(`/api/practice/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysis: data })
        }).catch(e => console.error("Failed to patch session analysis", e));
      }
    } catch (e) { console.error("Analysis failed", e); }
    setIsAnalyzing(false);
  };

  const handleImprove = async () => {
    setTab("improve");
    if (improve || messages.length === 0 || !analysis) return;
    setIsImproving(true);
    try {
      const res = await fetch("/api/practice/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, analysis, personId })
      });
      const data = await res.json();
      setImprove(data);
      if (sessionId) {
        fetch(`/api/practice/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ improve: data })
        }).catch(e => console.error("Failed to patch session improve", e));
      }
    } catch (e) { console.error("Improve failed", e); }
    setIsImproving(false);
  };

  const handleImproveTab = () => {
    if (!analysis) {
      handleAnalyze().then(() => handleImprove());
    } else {
      handleImprove();
    }
  };

  const toggleImpact = async (idx: number, msgContent: string) => {
    const existing = impactMap[idx];
    if (existing?.result) {
      setImpactMap(prev => { const c = { ...prev }; delete c[idx]; return c; });
      return;
    }
    setImpactMap(prev => ({ ...prev, [idx]: { loading: true, result: null } }));
    try {
      const res = await fetch("/api/practice/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: msgContent }], scenario, personId })
      });
      const data = await res.json();
      const score = data?.overallRead || "";
      const color = score.toLowerCase().includes("well") || score.toLowerCase().includes("good") ? "green"
        : score.toLowerCase().includes("bad") || score.toLowerCase().includes("wrong") ? "red" : "yellow";
      setImpactMap(prev => ({ ...prev, [idx]: { loading: false, result: { text: data?.overallRead || "No analysis available.", color } } }));
    } catch {
      setImpactMap(prev => ({ ...prev, [idx]: { loading: false, result: { text: "Analysis unavailable.", color: "yellow" } } }));
    }
  };

  const startNewSession = () => {
    setSessionId(null);
    setScenario("");
    setMood("neutral");
    setStakes("medium");
    setMessages([]);
    setAnalysis(null);
    setImprove(null);
    setImpactMap({});
    setTab("rehearse");
  };

  const loadSession = async (session: any) => {
    setSessionId(session._id);
    setScenario(session.scenario);
    setMood(session.mood as Mood);
    setStakes(session.stakes as Stakes);
    setMessages(session.messages || []);
    setAnalysis(session.analysis || null);
    setImprove(session.improve || null);
    setImpactMap({});
    setTab("rehearse");

    try {
      const res = await fetch(`/api/practice/sessions/${session._id}`);
      const data = await res.json();
      if (data.session) {
        setMessages(data.session.messages || []);
        setAnalysis(data.session.analysis || null);
        setImprove(data.session.improve || null);
      }
    } catch (e) {
      console.error("Failed to load full session details", e);
    }
  };

  const loadPracticePrompt = (prompt: any) => {
    setSessionId(null);
    setScenario(prompt.scenario || "");
    setMood((prompt.mood as Mood) || "neutral");
    setStakes((prompt.stakes as Stakes) || "medium");
    setMessages([]);
    setAnalysis(null);
    setImprove(null);
    setImpactMap({});
    setTab("rehearse");
  };

  const Skeleton = () => (
    <div className="prac-skeleton-wrap">
      <div className="skel skel-title" style={{ height: 28, width: "60%", marginBottom: 8 }}></div>
      <div className="skel skel-box" style={{ height: 80, marginBottom: 12 }}></div>
      <div className="skel skel-box" style={{ height: 60, marginBottom: 12 }}></div>
      <div className="skel skel-box" style={{ height: 60 }}></div>
    </div>
  );

  return (
    <div className="practice-overlay" data-mode="practice">
      <div className="practice-layout">
        {/* Sidebar */}
        <div className="practice-sidebar">
          <button className="prac-new-btn" onClick={startNewSession}>+ New Session</button>
          <div className="prac-session-list">
             {sessions.map(s => (
               <div key={s._id} className={`prac-session-card ${s._id === sessionId ? 'active' : ''}`} onClick={() => loadSession(s)}>
                 <div className="psc-scenario">{s.scenario?.slice(0, 40)}{s.scenario?.length > 40 ? '...' : ''}</div>
                 <div className="psc-meta">
                   <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                   <span className="psc-mood">{MOOD_EMOJIS[s.mood as Mood]} {s.mood}</span>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="practice-main">
          {/* Header */}
          <div className="practice-header">
            <div className="ph-left">
              🎯 Practice Mode <span className="ph-name">with {activePerson?.name}</span>
            </div>
            <button className="ph-close" onClick={onClose}>✕</button>
          </div>

          {/* Tab pills - centered */}
          <div className="practice-tabs">
            <button className={`ptab ${tab === "rehearse" ? "active" : ""}`} onClick={() => setTab("rehearse")}>Rehearse</button>
            <button className={`ptab ${tab === "analyze" ? "active" : ""}`} onClick={handleAnalyze}>Analyze</button>
            <button className={`ptab ${tab === "improve" ? "active" : ""}`} onClick={handleImproveTab}>Improve</button>
          </div>

          <div className="practice-body">
            {/* ── REHEARSE TAB ── */}
            {tab === "rehearse" && (
          <div className="prac-rehearse">
            {/* Scenario card */}
            <div className="prac-context-card">
              <input
                className="prac-scenario-input"
                placeholder="What are you trying to do? e.g. apologize for missing a call"
                value={scenario}
                onChange={e => setScenario(e.target.value)}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="prac-pills-label">Mood</span>
                  <div className="prac-pills-section">
                    {(["neutral", "upset", "happy", "distant", "confused"] as Mood[]).map(m => (
                      <button key={m} className={`prac-pill ${mood === m ? "active" : ""}`} onClick={() => setMood(m)}>
                        {MOOD_EMOJIS[m]} {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="prac-pills-label">Stakes</span>
                  <div className="prac-pills-section">
                    {(["low", "medium", "high", "very high"] as Stakes[]).map(s => (
                      <button key={s} className={`prac-pill ${stakes === s ? "active" : ""}`} onClick={() => setStakes(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat area */}
            <div className="prac-chat-area" ref={chatRef}>
              {messages.length === 0 && !streamedText && (
                <div className="prac-empty">Set the scenario above and say something!</div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`prac-msg-row`}>
                  <div className={`prac-msg-inner ${m.role === "user" ? "user" : ""}`}>
                    {m.role !== "user" && (
                      <Avatar avatar={activePerson?.avatar} name={activePerson?.name || "Nova"} size={28} className="msg-av" />
                    )}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: 4 }}>
                      <div className={m.role === "user" ? "prac-bubble-user" : "prac-bubble-received"}>
                        {m.content}
                      </div>
                      {m.role === "user" && (
                        <button className="impact-pill" onClick={() => toggleImpact(i, m.content)}>
                          {impactMap[i]?.loading ? "⏳" : impactMap[i]?.result ? "✕ hide" : "👁 impact"}
                        </button>
                      )}
                      {impactMap[i]?.result && (
                        <div className={`impact-card ${impactMap[i].result.color}`}>
                          {impactMap[i].result.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isStreaming && streamedText && (
                <div className="prac-msg-row">
                  <div className="prac-msg-inner">
                    <Avatar avatar={activePerson?.avatar} name={activePerson?.name || "Nova"} size={28} className="msg-av" />
                    <div className="prac-bubble-received">{streamedText}</div>
                  </div>
                </div>
              )}
              {isStreaming && !streamedText && (
                <div className="prac-msg-row">
                  <div className="prac-msg-inner">
                    <Avatar avatar={activePerson?.avatar} name={activePerson?.name || "Nova"} size={28} className="msg-av" />
                    <div className="typing-bubble">
                      <div className="td"></div><div className="td"></div><div className="td"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="prac-input-zone">
              <div className="input-card">
                <textarea
                  ref={inputRef}
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={e => { setInputValue(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  rows={1}
                />
                <div className="input-bottom">
                  <div className="char-ct">{inputValue.length}/500</div>
                  <button className="send-btn" onClick={handleSend} disabled={!inputValue.trim() || isStreaming}
                    style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 4px 16px rgba(245,158,11,0.4)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYZE TAB ── */}
        {tab === "analyze" && (
          <div className="prac-scroll-content">
            {isAnalyzing ? <Skeleton /> : analysis ? (
              <div className="prac-analysis-view">
                {/* Overall read */}
                <div className="pa-overall-card">{analysis.overallRead}</div>

                {/* What landed well */}
                {analysis.didWell?.length > 0 && (
                  <div className="pa-section">
                    <div className="pa-label">✓ What landed well</div>
                    {analysis.didWell.map((item: string, i: number) => (
                      <div key={i} className="pa-card green">
                        <div className="pa-card-icon">✓</div>
                        <div className="pa-card-body">{item}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* What landed wrong */}
                {analysis.landedWrong?.length > 0 && (
                  <div className="pa-section">
                    <div className="pa-label">✗ What landed wrong</div>
                    {analysis.landedWrong.map((item: any, i: number) => (
                      <div key={i} className="pa-card red">
                        <div className="pa-card-icon">✗</div>
                        <div className="pa-card-text">
                          <div className="pa-card-quote">"{item.quote}"</div>
                          <div className="pa-card-body">{item.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Patterns */}
                {analysis.patterns?.length > 0 && (
                  <div className="pa-section">
                    <div className="pa-label">🔄 Patterns</div>
                    {analysis.patterns.map((item: string, i: number) => (
                      <div key={i} className="pa-card amber">
                        <div className="pa-card-icon">🔄</div>
                        <div className="pa-card-body">{item}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Their perspective */}
                {analysis.theirPerspective && (
                  <div className="pa-section">
                    <div className="pa-label">💜 Their perspective</div>
                    <div className="pa-card purple">
                      <div className="pa-card-body">{analysis.theirPerspective}</div>
                    </div>
                  </div>
                )}

                {/* Unsaid thing */}
                {analysis.unsaidThing && (
                  <div className="pa-section">
                    <div className="pa-label">🌑 What you&apos;re not saying</div>
                    <div className="pa-card dark">
                      <div className="pa-card-body" style={{ color: "var(--text-2)", fontStyle: "italic" }}>{analysis.unsaidThing}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="prac-empty">Rehearse a conversation first to get analysis.</div>
            )}
          </div>
        )}

        {/* ── IMPROVE TAB ── */}
        {tab === "improve" && (
          <div className="prac-scroll-content">
            {isImproving ? <Skeleton /> : improve ? (
              <div className="prac-improve-view">
                {/* Suggested opener / what to actually say */}
                {improve.suggestedOpener && (
                  <div className="pa-section">
                    <div className="pa-label">💡 What to actually say</div>
                    <div className="improve-highlight-box">{improve.suggestedOpener}</div>
                  </div>
                )}

                {/* Rewritten messages */}
                {improve.rewrites?.length > 0 && (
                  <div className="pa-section">
                    <div className="pa-label">✏️ Rewritten messages</div>
                    {improve.rewrites.map((item: any, i: number) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div className="improve-rewrite-pair">
                          <div className="improve-orig-card">
                            <div className="improve-label">You said</div>
                            <div className="improve-text">{item.original}</div>
                          </div>
                          <div className="improve-new-card">
                            <div className="improve-label">Try this</div>
                            <div className="improve-text">{item.rewritten}</div>
                          </div>
                        </div>
                        {item.why && <div className="improve-why">{item.why}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Practice prompts */}
                {improve.practicePrompts?.length > 0 && (
                  <div className="pa-section">
                    <div className="pa-label">🎯 Try these scenarios</div>
                    <div className="improve-scenario-cards">
                      {improve.practicePrompts.map((item: any, i: number) => (
                        <div key={i} className="improve-scenario-card" onClick={() => loadPracticePrompt(item)}>
                          <div className="isc-emoji">{["💬", "🔥", "💔"][i % 3]}</div>
                          <div className="isc-label">{item.label}</div>
                          <div className="isc-pills">
                            <span className="isc-pill">{item.mood}</span>
                            <span className="isc-pill">{item.stakes} stakes</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="prac-empty">Analyze your conversation first to get improvements.</div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
</div>
  );
}
