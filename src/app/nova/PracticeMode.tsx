"use client";

import React, { useState, useRef, useEffect } from "react";

interface PracticeModeProps {
  personId: string;
  userId: string;
  activePerson: any;
  onClose: () => void;
}

export default function PracticeMode({ personId, userId, activePerson, onClose }: PracticeModeProps) {
  const [tab, setTab] = useState<"rehearse" | "analyze" | "improve">("rehearse");
  
  const [scenario, setScenario] = useState("");
  const [mood, setMood] = useState<"neutral" | "upset" | "happy" | "distant" | "confused">("neutral");
  const [stakes, setStakes] = useState<"low" | "medium" | "high" | "very high">("medium");

  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");

  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [improve, setImprove] = useState<any>(null);
  const [isImproving, setIsImproving] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (smooth = true) => {
    if (!chatRef.current) return;
    chatRef.current.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: smooth ? "smooth" : "auto"
    });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, streamedText, tab]);

  const handleSend = async () => {
    if ((!inputValue.trim() && !streamedText) || isStreaming) return;
    
    const userText = inputValue.trim();
    setInputValue("");
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const newMsg = { role: "user", content: userText };
    setMessages(prev => [...prev, newMsg]);
    setIsStreaming(true);
    setStreamedText("");

    try {
      const res = await fetch("/api/practice/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({
          messages: [...messages, newMsg],
          scenario,
          otherPersonMood: mood,
          stakes,
          personId
        })
      });

      if (!res.ok) throw new Error("Practice Chat API Error");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") break;
              try {
                const data = JSON.parse(payload);
                if (data.text) {
                  fullResponse += data.text;
                  setStreamedText(fullResponse);
                }
              } catch (e) {}
            }
          }
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: fullResponse }]);
      setStreamedText("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsStreaming(false);
      scrollToBottom();
    }
  };

  const handleAnalyze = async () => {
    setTab("analyze");
    if (analysis || messages.length === 0) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/practice/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ messages, scenario, personId })
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      console.error("Analysis failed", e);
    }
    setIsAnalyzing(false);
  };

  const handleImprove = async () => {
    setTab("improve");
    if (improve || messages.length === 0 || !analysis) return;
    setIsImproving(true);
    try {
      const res = await fetch("/api/practice/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ messages, analysis, personId })
      });
      const data = await res.json();
      setImprove(data);
    } catch (e) {
      console.error("Improve failed", e);
    }
    setIsImproving(false);
  };

  const loadPracticePrompt = (prompt: any) => {
    setScenario(prompt.scenario);
    setMood(prompt.mood as any);
    setStakes(prompt.stakes as any);
    setMessages([]);
    setAnalysis(null);
    setImprove(null);
    setTab("rehearse");
  };

  const analyzeSingleMessage = async (msgContent: string) => {
    alert("Inline impact analysis: (API integration pending)\nAnalyzing: " + msgContent);
  };

  return (
    <div className="practice-overlay" data-mode="practice">
      <div className="practice-header">
        <div className="ph-left">🎯 Practice Mode <span className="ph-name">with {activePerson?.name}</span></div>
        <button className="ph-close" onClick={onClose}>✕</button>
      </div>

      <div className="practice-tabs">
        <button className={`ptab ${tab === "rehearse" ? "active" : ""}`} onClick={() => setTab("rehearse")}>Rehearse</button>
        <button className={`ptab ${tab === "analyze" ? "active" : ""}`} onClick={handleAnalyze}>Analyze</button>
        <button className={`ptab ${tab === "improve" ? "active" : ""}`} onClick={() => { if(!analysis) handleAnalyze().then(() => handleImprove()); else handleImprove(); }}>Improve</button>
      </div>

      <div className="practice-body">
        {tab === "rehearse" && (
          <div className="prac-rehearse">
            <div className="prac-context-bar">
              <input 
                className="prac-input-sit" 
                placeholder="What are you trying to do? e.g. apologize for missing call" 
                value={scenario}
                onChange={e => setScenario(e.target.value)}
              />
              <div className="prac-pills-row">
                <select className="prac-select" value={mood} onChange={e => setMood(e.target.value as any)}>
                  <option value="neutral">Neutral Mood</option>
                  <option value="upset">Upset Mood</option>
                  <option value="happy">Happy Mood</option>
                  <option value="distant">Distant Mood</option>
                  <option value="confused">Confused Mood</option>
                </select>
                <select className="prac-select" value={stakes} onChange={e => setStakes(e.target.value as any)}>
                  <option value="low">Low Stakes</option>
                  <option value="medium">Medium Stakes</option>
                  <option value="high">High Stakes</option>
                  <option value="very high">Very High Stakes</option>
                </select>
              </div>
            </div>
            
            <div className="prac-chat-area" ref={chatRef}>
              {messages.length === 0 && !streamedText && (
                 <div className="prac-empty">Set the scenario above and say something!</div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`msg-row ${m.role === 'user' ? 'user' : 'nova'}`}>
                  <div className="msg-inner" style={{flexDirection: 'column', alignItems: m.role==='user'?'flex-end':'flex-start'}}>
                    <div style={{display:'flex', gap: 8, alignItems: 'flex-end'}}>
                      {m.role !== 'user' && <div className="msg-av" style={{background:'rgba(255,255,255,0.1)'}}>{activePerson?.emoji}</div>}
                      <div className="msg-bubble" style={{background: m.role==='user' ? 'var(--prac-accent)' : 'var(--prac-surface)', color: '#fff'}}>{m.content}</div>
                    </div>
                    {m.role === 'user' && (
                      <button className="inline-impact-btn" onClick={() => analyzeSingleMessage(m.content)}>👁 see impact</button>
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && streamedText && (
                <div className={`msg-row nova`}>
                  <div className="msg-inner">
                    <div className="msg-av" style={{background:'rgba(255,255,255,0.1)'}}>{activePerson?.emoji}</div>
                    <div className="msg-bubble" style={{background: 'var(--prac-surface)', color: '#fff'}}>{streamedText}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="prac-input-zone">
               <div className="input-card" style={{background: 'var(--prac-surface)', border: 'none'}}>
                  <textarea
                    ref={inputRef}
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                    rows={1}
                    style={{color: '#fff'}}
                  />
                  <button className="send-btn" onClick={handleSend} disabled={!inputValue.trim() || isStreaming} style={{color: 'var(--prac-accent)'}}>
                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  </button>
               </div>
            </div>
          </div>
        )}

        {tab === "analyze" && (
          <div className="prac-scroll-content">
            {isAnalyzing ? (
              <div className="prac-skeleton-wrap">
                <div className="skel skel-title"></div>
                <div className="skel skel-text"></div>
                <div className="skel skel-text w80"></div>
                <div className="skel skel-box"></div>
                <div className="skel skel-box"></div>
              </div>
            ) : analysis ? (
              <div className="prac-analysis-view">
                <div className="pa-read">{analysis.overallRead}</div>
                
                <div className="pa-section">
                  <div className="pa-label">What you did well</div>
                  <ul className="pa-list">
                    {analysis.didWell?.map((item: string, i: number) => <li key={i}>{item}</li>)}
                  </ul>
                </div>

                <div className="pa-section">
                  <div className="pa-label">What landed wrong</div>
                  {analysis.landedWrong?.map((item: any, i: number) => (
                    <div key={i} className="pa-quote-card">
                      <div className="pa-quote">"{item.quote}"</div>
                      <div className="pa-reason"><strong>Why:</strong> {item.reason}</div>
                    </div>
                  ))}
                </div>

                <div className="pa-section">
                  <div className="pa-label">Hidden patterns</div>
                  <ul className="pa-list">
                    {analysis.patterns?.map((item: string, i: number) => <li key={i}>{item}</li>)}
                  </ul>
                </div>

                <div className="pa-section">
                  <div className="pa-label">How they likely actually felt</div>
                  <div className="pa-para">{analysis.theirPerspective}</div>
                </div>

                <div className="pa-section">
                  <div className="pa-label">The thing you're not saying</div>
                  <div className="pa-para">{analysis.unsaidThing}</div>
                </div>
              </div>
            ) : (
              <div className="prac-empty">Rehearse a conversation first to get analysis.</div>
            )}
          </div>
        )}

        {tab === "improve" && (
          <div className="prac-scroll-content">
            {isImproving ? (
              <div className="prac-skeleton-wrap">
                <div className="skel skel-title"></div>
                <div className="skel skel-box"></div>
                <div className="skel skel-box"></div>
              </div>
            ) : improve ? (
              <div className="prac-improve-view">
                <div className="pa-section">
                  <div className="pa-label">Suggested Opener</div>
                  <div className="pa-opener-box">{improve.suggestedOpener}</div>
                </div>

                <div className="pa-section">
                  <div className="pa-label">Rewritten Messages</div>
                  {improve.rewrites?.map((item: any, i: number) => (
                    <div key={i} className="pa-rewrite-card">
                      <div className="pr-orig"><span>You said:</span> {item.original}</div>
                      <div className="pr-new"><span>Try this:</span> {item.rewritten}</div>
                      <div className="pr-why">{item.why}</div>
                    </div>
                  ))}
                </div>

                <div className="pa-section">
                  <div className="pa-label">Practice Prompts</div>
                  <div className="pr-prompts-grid">
                    {improve.practicePrompts?.map((item: any, i: number) => (
                      <div key={i} className="pr-prompt-card" onClick={() => loadPracticePrompt(item)}>
                        <div className="prp-label">{item.label}</div>
                        <div className="prp-meta">{item.mood} • {item.stakes} stakes</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="prac-empty">Analyze your conversation first to get improvements.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
