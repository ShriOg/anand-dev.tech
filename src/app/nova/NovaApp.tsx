"use client";

import React, { useState, useEffect, useRef } from "react";
import "./nova.css";

// Declare global for marked and hljs which are loaded via script tags in layout
declare global {
  interface Window {
    marked: any;
    hljs: any;
  }
}

const PERSONAS: Record<string, { status: string; name: string; desc: string; icon: string }> = {
  nova: { status: "online · thinking about you 💕", name: "Girlfriend", desc: "warm, playful, your person", icon: "🩷" },
  scholar: { status: "online · ready to study with you 📚", name: "Scholar", desc: "patient study buddy 🤓", icon: "📚" },
  sage: { status: "online · here to guide you 🌿", name: "Sage", desc: "calm & wise, listens deeply", icon: "🌿" },
  spark: { status: "online · buzzing with ideas ⚡", name: "Spark", desc: "chaotic creative energy ✨", icon: "⚡" }
};

export default function NovaApp() {
  const [isMounted, setIsMounted] = useState(false);
  const [companionName, setCompanionName] = useState("");
  const [companionImage, setCompanionImage] = useState("");
  const [currentPersona, setCurrentPersona] = useState("nova");
  const [messages, setMessages] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [firstMsg, setFirstMsg] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [allChats, setAllChats] = useState<any[]>([]);
  const [theme, setTheme] = useState("dark");
  const [inputValue, setInputValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [onboardingMode, setOnboardingMode] = useState<"hidden" | "new" | "edit">("hidden");
  const [pendingImage, setPendingImage] = useState("");
  const [pendingName, setPendingName] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);

  const [streamedText, setStreamedText] = useState("");

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollFabRef = useRef<HTMLButtonElement>(null);
  const userIdRef = useRef<string>("");

  // Initialization
  useEffect(() => {
    setIsMounted(true);
    
    // Set marked renderer if available
    if (window.marked && window.hljs) {
      window.marked.setOptions({ breaks: true, gfm: true });
      const renderer = new window.marked.Renderer();
      renderer.code = (code: string, lang: string) => {
        const l = (lang && window.hljs.getLanguage(lang)) ? lang : "plaintext";
        let hi;
        try { hi = window.hljs.highlight(code, { language: l }).value; } 
        catch { hi = window.hljs.highlightAuto(code).value; }
        const ec = code.replace(/"/g, "&quot;");
        return `<div class="code-block-wrap"><div class="code-block-header"><span>${l}</span><button class="code-copy-btn" data-code="${ec}">Copy</button></div><pre><code class="hljs language-${l}">${hi}</code></pre></div>`;
      };
      window.marked.setOptions({ renderer });
    }

    let uid = localStorage.getItem("nova_user_id");
    if (!uid) {
      uid = crypto.randomUUID();
      localStorage.setItem("nova_user_id", uid);
    }
    userIdRef.current = uid;

    const savedName = localStorage.getItem("companion-name");
    const savedImage = localStorage.getItem("companion-image");
    const savedPersona = localStorage.getItem("persona");
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
      setTheme("light");
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }

    if (savedPersona) setCurrentPersona(savedPersona);

    if (savedName) {
      setCompanionName(savedName);
      if (savedImage) setCompanionImage(savedImage);
      bootIntoApp(savedPersona || "nova");
    } else {
      setOnboardingMode("new");
    }

    // Attach delegated events for code copy buttons
    const handleCopy = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains('code-copy-btn')) {
        const code = target.getAttribute('data-code');
        if (code) {
          navigator.clipboard.writeText(code.replace(/&quot;/g, '"'));
          const originalText = target.textContent;
          target.textContent = "Copied!";
          setTimeout(() => target.textContent = originalText, 1500);
        }
      }
    };
    document.addEventListener('click', handleCopy);
    return () => document.removeEventListener('click', handleCopy);
  }, []);

  // Update body theme class
  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  }, [theme]);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!chatContainerRef.current || !scrollFabRef.current) return;
      const { scrollHeight, scrollTop, clientHeight } = chatContainerRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 80;
      if (!atBottom && !firstMsg) {
        scrollFabRef.current.classList.add("show");
      } else {
        scrollFabRef.current.classList.remove("show");
      }
    };
    const el = chatContainerRef.current;
    if (el) el.addEventListener("scroll", handleScroll);
    return () => { if (el) el.removeEventListener("scroll", handleScroll); };
  }, [firstMsg]);

  // API Helpers
  const getHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-id": userIdRef.current
  });

  const loadChats = async () => {
    try {
      const res = await fetch("/api/chats", { headers: { "x-user-id": userIdRef.current } });
      const data = await res.json();
      return data.chats || [];
    } catch { return []; }
  };

  const createChat = async (persona: string) => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ personality: persona })
      });
      const data = await res.json();
      return data.chat;
    } catch { return null; }
  };

  const loadChatMessages = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, { headers: { "x-user-id": userIdRef.current } });
      const data = await res.json();
      return data.messages || [];
    } catch { return []; }
  };

  const saveMessages = async (chatId: string, msgs: any[]) => {
    try {
      await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ messages: msgs })
      });
      // Auto-title
      if (msgs.length === 2 && msgs[0].role === "user") {
        const title = msgs[0].content.slice(0, 40);
        await fetch(`/api/chats/${chatId}`, {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({ title })
        });
        setAllChats(prev => prev.map(c => c.id === chatId ? { ...c, title } : c));
      }
    } catch {}
  };

  const bootIntoApp = async (persona: string) => {
    const chats = await loadChats();
    setAllChats(chats);
    if (!chats.length) {
      const chat = await createChat(persona);
      if (chat) {
        setAllChats([chat]);
        setCurrentChatId(chat.id);
        setMessages([]);
        setFirstMsg(true);
      }
    } else {
      const chat = chats[0];
      setCurrentChatId(chat.id);
      const msgs = await loadChatMessages(chat.id);
      setMessages(msgs);
      setFirstMsg(msgs.length === 0);
      scrollToBottom();
    }
  };

  const switchToChat = async (chatId: string) => {
    if (isStreaming) return;
    setCurrentChatId(chatId);
    const msgs = await loadChatMessages(chatId);
    setMessages(msgs);
    setFirstMsg(msgs.length === 0);
    setSidebarOpen(false);
    scrollToBottom();
  };

  const handleNewChat = async () => {
    if (isStreaming) return;
    const chat = await createChat(currentPersona);
    if (!chat) return;
    setAllChats([chat, ...allChats]);
    setCurrentChatId(chat.id);
    setMessages([]);
    setFirstMsg(true);
    setSidebarOpen(false);
    showToast("fresh start ✨");
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm("delete this chat?")) return;
    try {
      await fetch(`/api/chats/${chatId}`, { method: "DELETE", headers: { "x-user-id": userIdRef.current } });
      const newChats = allChats.filter(c => c.id !== chatId);
      setAllChats(newChats);
      if (currentChatId === chatId) {
        if (newChats.length) {
          switchToChat(newChats[0].id);
        } else {
          setCurrentChatId(null);
          setMessages([]);
          setFirstMsg(true);
        }
      }
    } catch {}
  };

  const handleRenameChat = async (chatId: string, oldTitle: string) => {
    const newTitle = prompt("rename chat:", oldTitle || "");
    if (newTitle && newTitle.trim()) {
      await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ title: newTitle.trim() })
      });
      setAllChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle.trim() } : c));
    }
  };

  const scrollToBottom = (smooth = false) => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: smooth ? "smooth" : "instant"
        });
      }
    }, 50);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastShow(true);
    setTimeout(() => setToastShow(false), 2200);
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text.replace(/[#*\`>_~]/g, ""));
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  };

  const submitMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    setInputValue("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    
    const newMsgs = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    if (firstMsg) setFirstMsg(false);
    scrollToBottom(true);
    setIsStreaming(true);
    setStreamedText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs,
          personality: currentPersona,
          companionName: companionName || "Nova"
        })
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const obj = JSON.parse(data);
            if (obj.error) {
              setMessages([...newMsgs, { role: "assistant", content: obj.error }]);
              setIsStreaming(false);
              return;
            }
            
            const chunkText = obj.text || obj.choices?.[0]?.delta?.content || "";
            if (chunkText) {
              fullText += chunkText;
              setStreamedText(fullText);
              scrollToBottom(true);
            }
          } catch {}
        }
      }

      setStreamedText("");
      const finalMsgs = [...newMsgs, { role: "assistant", content: fullText }];
      setMessages(finalMsgs);
      if (currentChatId) saveMessages(currentChatId, finalMsgs);
      if (soundOn) speak(fullText.slice(0, 400));
      scrollToBottom(true);
    } catch (e) {
      setStreamedText("");
      setMessages([...newMsgs, { role: "assistant", content: "ugh something broke 😭 wanna try again?" }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const regenMessage = () => {
    if (isStreaming || messages.length === 0) return;
    // Find last user message
    let lastUserIdx = messages.length - 1;
    while (lastUserIdx >= 0 && messages[lastUserIdx].role !== "user") lastUserIdx--;
    if (lastUserIdx < 0) return;
    
    const newMsgs = messages.slice(0, lastUserIdx + 1);
    setMessages(newMsgs);
    setIsStreaming(true);
    setStreamedText("");

    // Basically duplicate the fetch logic
    const reqBody = {
      messages: newMsgs,
      personality: currentPersona,
      companionName: companionName || "Nova"
    };

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody)
    }).then(async res => {
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const obj = JSON.parse(data);
            if (obj.error) throw new Error(obj.error);
            
            const chunkText = obj.text || obj.choices?.[0]?.delta?.content || "";
            if (chunkText) {
              fullText += chunkText;
              setStreamedText(fullText);
              scrollToBottom(true);
            }
          } catch {}
        }
      }
      setStreamedText("");
      const finalMsgs = [...newMsgs, { role: "assistant", content: fullText }];
      setMessages(finalMsgs);
      if (currentChatId) saveMessages(currentChatId, finalMsgs);
      if (soundOn) speak(fullText.slice(0, 400));
      scrollToBottom(true);
    }).catch(e => {
      setStreamedText("");
      setMessages([...newMsgs, { role: "assistant", content: "ugh something broke 😭 wanna try again?" }]);
    }).finally(() => {
      setIsStreaming(false);
    });
  };

  // Image resize
  const resizeImage = (file: File, maxPx = 240): Promise<string> => {
    return new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const r = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const c = document.createElement("canvas");
        c.width = img.width * r;
        c.height = img.height * r;
        const ctx = c.getContext("2d");
        if (ctx) ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(""); };
      img.src = url;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await resizeImage(file);
    if (data) setPendingImage(data);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveOnboarding = () => {
    const name = pendingName.trim();
    if (!name) return;
    setCompanionName(name);
    setCompanionImage(pendingImage);
    localStorage.setItem("companion-name", name);
    localStorage.setItem("companion-image", pendingImage);
    
    if (onboardingMode === "new") {
      bootIntoApp(currentPersona);
    } else {
      showToast(`saved! hey ${name} 💕`);
    }
    setOnboardingMode("hidden");
  };

  const parseMd = (t: string) => window.marked ? window.marked.parse(t) : t;
  const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");

  if (!isMounted) return null;

  return (
    <>
      <div className="aurora">
        <div className="aurora-blob ab1"></div>
        <div className="aurora-blob ab2"></div>
        <div className="aurora-blob ab3"></div>
      </div>

      {/* Onboarding */}
      <div className={`onboarding ${onboardingMode === "hidden" ? "hidden" : ""}`} id="onboarding">
        <div className="ob-card">
          <div className="ob-sparkle">🩷</div>
          <div className="ob-heading">
            <h2>create your <span>girlfriend</span> 🩷</h2>
            <p>give her a name & a cute pic —<br />she's all yours 🥺✨</p>
          </div>
          <div className="ob-av-section">
            <div className="ob-av-ring" onClick={() => fileInputRef.current?.click()} title="tap to add her pic!">
              <div className="ob-av-inner">
                {pendingImage ? (
                  <img className="ob-av-img" src={pendingImage} alt="companion" style={{ display: "block" }} />
                ) : (
                  <span className="ob-av-letter">{pendingName ? pendingName.charAt(0).toUpperCase() : "?"}</span>
                )}
                <div className="ob-av-hover"><span>📷</span><span>add her pic!</span></div>
              </div>
            </div>
            <span className="ob-av-hint">tap to add a photo — totally optional tho 🥺</span>
            {pendingImage && (
              <button className="ob-remove-img show" onClick={(e) => { e.stopPropagation(); setPendingImage(""); }}>✕ remove photo</button>
            )}
            <input type="file" ref={fileInputRef} accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
          </div>
          <div className="ob-name-wrap">
            <input 
              className="ob-name-input" type="text" maxLength={20}
              placeholder="e.g. Nova, Aria, Luna, Mia, Yuki…" autoComplete="off"
              value={pendingName} onChange={e => setPendingName(e.target.value)}
            />
          </div>
          <button className="ob-start-btn" disabled={!pendingName.trim()} onClick={saveOnboarding}>
            {onboardingMode === "edit" ? "save changes ✨" : "let's go!! 🩷"}
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className={`settings-overlay ${settingsOpen ? "open" : ""}`} onClick={() => setSettingsOpen(false)}></div>
      <div className={`settings-panel ${settingsOpen ? "open" : ""}`}>
        <div className="sp-head">
          <div className="sp-title">Settings</div>
          <button className="sp-close" onClick={() => setSettingsOpen(false)}>✕</button>
        </div>
        <div className="sp-body">
          <div>
            <div className="sp-label">Your companion</div>
            <div className="companion-preview">
              <div className="sp-comp-av">
                {companionImage ? <img src={companionImage} alt={companionName} /> : (companionName || "N").charAt(0).toUpperCase()}
              </div>
              <div className="sp-comp-info">
                <div className="sp-comp-name">{companionName || "Nova"}</div>
                <div className="sp-comp-sub">tap edit to rename or change photo</div>
              </div>
              <button className="sp-edit-btn" onClick={() => {
                setSettingsOpen(false);
                setPendingName(companionName);
                setPendingImage(companionImage);
                setOnboardingMode("edit");
              }}>Edit</button>
            </div>
          </div>
          <div>
            <div className="sp-label">Personality</div>
            <div className="persona-grid">
              {Object.entries(PERSONAS).map(([key, p]) => (
                <button 
                  key={key} 
                  className={`persona-card ${currentPersona === key ? "active" : ""}`}
                  onClick={() => {
                    setCurrentPersona(key);
                    localStorage.setItem("persona", key);
                    showToast(`switched to ${key} mode ✨`);
                  }}
                >
                  <span className="pc-icon">{p.icon}</span><span className="pc-name">{p.name}</span>
                  <span className="pc-desc">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="sp-label">Preferences</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="sp-row">
                <div><div className="sp-row-label">Light mode</div><div className="sp-row-sub">Softer lavender theme</div></div>
                <label className="toggle">
                  <input type="checkbox" checked={theme === "light"} onChange={e => {
                    const newTheme = e.target.checked ? "light" : "dark";
                    setTheme(newTheme);
                    localStorage.setItem("theme", newTheme);
                  }} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="sp-row">
                <div><div className="sp-row-label">Voice readout</div><div className="sp-row-sub">Speak replies aloud</div></div>
                <label className="toggle">
                  <input type="checkbox" checked={soundOn} onChange={e => setSoundOn(e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
          <div>
            <div className="sp-label">Data</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="danger-btn" onClick={async () => {
                if (!currentChatId) return;
                await fetch(`/api/chats/${currentChatId}/messages`, {
                  method: "POST", headers: { "Content-Type": "application/json", "x-user-id": userIdRef.current },
                  body: JSON.stringify({ messages: [] })
                });
                setMessages([]);
                setFirstMsg(true);
                setSettingsOpen(false);
                showToast("cleared 🗑️");
              }}>🗑️ Clear conversation</button>
              <button className="danger-btn" onClick={() => {
                localStorage.removeItem("companion-name");
                localStorage.removeItem("companion-image");
                window.location.reload();
              }}>👤 Reset companion setup</button>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.8 }}>
              AI Companion · Powered by Groq<br />llama-3.3-70b-versatile<br />
              <span style={{ fontSize: 22, marginTop: 6, display: "block" }}>🌸</span>
            </div>
          </div>
        </div>
      </div>

      {/* App Layout */}
      <div className="app-wrapper">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarOpen ? "open" : ""}`} id="sidebar">
          <div className="sidebar-head">
            <span className="sidebar-title">Nova</span>
            <button className="sidebar-new" onClick={handleNewChat}>✦ new chat</button>
          </div>
          <div className="sidebar-list">
            {!allChats.length ? (
              <div className="sidebar-empty">no chats yet 🥺<br />start one!</div>
            ) : (
              allChats.map(c => {
                const active = c.id === currentChatId ? " active" : "";
                const d = new Date(c.updatedAt || c.created_at || Date.now());
                const meta = isNaN(d.getTime()) ? "" : d.toLocaleDateString([], { month: "short", day: "numeric" });
                const icon = PERSONAS[c.personality]?.icon || "💬";
                return (
                  <div key={c.id} className={`sidebar-chat${active}`} onClick={() => switchToChat(c.id)}>
                    <div className="sidebar-chat-icon">{icon}</div>
                    <div className="sidebar-chat-info">
                      <div className="sidebar-chat-title">{c.title || "new chat"}</div>
                      <div className="sidebar-chat-meta">{meta}</div>
                    </div>
                    <button className="sidebar-chat-menu" onClick={(e) => {
                      e.stopPropagation();
                      const action = prompt("Type 'rename' to rename, 'delete' to delete:");
                      if (action === "rename") handleRenameChat(c.id, c.title);
                      else if (action === "delete") handleDeleteChat(c.id);
                    }}>···</button>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)}></div>
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>

        <div className="app">
          {/* Topbar */}
          <div className="topbar">
            <div className="nova-av-wrap">
              <div className="nova-av">
                {companionImage ? <img src={companionImage} alt={companionName} /> : (companionName || "N").charAt(0).toUpperCase()}
              </div>
              <div className="online-ring"></div>
              <div className="online-dot"></div>
            </div>
            <div className="nova-info">
              <div className="nova-name">{companionName || "Nova"}</div>
              <div className="nova-status">
                <span className="ns-dot"></span>
                <span>{PERSONAS[currentPersona]?.status || PERSONAS.nova.status}</span>
              </div>
            </div>
            <div className="topbar-btns">
              <div className="model-pill"><span className="mp-dot"></span><span>llama-3.3-70b</span></div>
              <button className="tbtn" onClick={handleNewChat}>✦<span className="tip">New chat</span></button>
              <button className="tbtn" onClick={() => setSettingsOpen(true)}>⚙️<span className="tip">Settings</span></button>
            </div>
          </div>

          {/* Chat Area */}
          <div className="chat-area" ref={chatContainerRef}>
            {firstMsg && (
              <div className="welcome">
                <div className={`welcome-orb ${companionImage ? "has-img" : ""}`} style={!companionImage ? { background: "var(--nova-grad)" } : {}}>
                  {companionImage ? (
                    <img src={companionImage} alt={companionName} />
                  ) : (
                    <span className="welcome-orb-letter" style={{ fontSize: 38, fontWeight: 800, color: "#fff" }}>
                      {(companionName || "N").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="welcome-title">omg hey!! i'm <span className="g">{companionName || "Nova"}</span> 🩷</div>
                  <div className="welcome-sub" style={{ marginTop: 8 }}>
                    your person ✨ here whenever you need me — to vent, to celebrate, to talk about literally anything 🥺
                  </div>
                </div>
                <div className="starters">
                  {[
                    { q: "i'm having the worst day rn honestly 😭", icon: "💭", title: "vent to me", sub: "i'm here, tell me everything" },
                    { q: "omg tell me something cute or fun!!", icon: "✨", title: "fun vibes only", sub: "hype me up or surprise me" },
                    { q: "i literally just did something i've been working towards forever and i'm so happy", icon: "🎉", title: "share a win!!", sub: "omg tell me the good news" },
                    { q: "can i just talk to you about something on my mind", icon: "🥺", title: "let's just talk", sub: "no topic too small, i'm listening" },
                  ].map((s, i) => (
                    <button key={i} className="starter" onClick={() => submitMessage(s.q)}>
                      <span className="starter-icon">{s.icon}</span><span className="starter-title">{s.title}</span>
                      <span className="starter-sub">{s.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!firstMsg && (
              <div className="msg-row">
                <div className="day-divider">
                  <div className="day-line"></div>
                  <div className="day-label">{new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</div>
                  <div className="day-line"></div>
                </div>
              </div>
            )}

            {messages.map((m, i) => {
              const isNova = m.role === "assistant" || m.role === "nova";
              const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const name = companionName || "Nova";

              return (
                <div key={i} className={`msg-row ${isNova ? "nova" : "user"}`}>
                  <div className="msg-inner">
                    {isNova && (
                      <div className="msg-av nova-av">
                        {companionImage ? <img src={companionImage} alt={name} /> : name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="msg-body">
                      <div className="msg-meta">
                        {isNova ? (
                          <><span>{name}</span><span>{time}</span></>
                        ) : (
                          <><span>{time}</span><span>You</span></>
                        )}
                        <div className="msg-actions">
                          <button className="mact copy-msg" title="Copy" onClick={() => {
                            navigator.clipboard.writeText(m.content);
                            showToast("copied! 📋");
                          }}>📋</button>
                          {isNova && <button className="mact regen-msg" title="Regenerate" onClick={regenMessage}>↻</button>}
                        </div>
                      </div>
                      <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: parseMd(m.content) }}></div>
                    </div>
                    {!isNova && <div className="msg-av user-av">🧑</div>}
                  </div>
                </div>
              );
            })}

            {isStreaming && (
              <div className="typing-row">
                <div className="typing-inner">
                  <div className="msg-av nova-av">
                    {companionImage ? <img src={companionImage} alt={companionName} /> : (companionName || "N").charAt(0).toUpperCase()}
                  </div>
                  {streamedText ? (
                    <div className="msg-body">
                      <div className="msg-meta">
                        <span>{companionName || "Nova"}</span><span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: parseMd(streamedText) }}></div>
                    </div>
                  ) : (
                    <div className="typing-bubble">
                      <div className="td"></div><div className="td"></div><div className="td"></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button className="scroll-fab" ref={scrollFabRef} onClick={() => scrollToBottom(true)}>↓</button>

          {/* Input Zone */}
          <div className="input-zone">
            <div className="input-card">
              <textarea 
                ref={inputRef} rows={1} placeholder={`Message ${companionName || "Nova"}…`} 
                maxLength={4000} autoComplete="off" value={inputValue}
                onChange={e => {
                  setInputValue(e.target.value);
                  if (inputRef.current) {
                    inputRef.current.style.height = "auto";
                    inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 180) + "px";
                  }
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitMessage(inputValue);
                  }
                }}
              ></textarea>
              <div className="input-bar">
                <div className="input-hints">
                  <span className="hint">↵ Send</span>
                  <span className="hint">⇧↵ New line</span>
                </div>
                <div className="input-right">
                  <span className="char-ct">{inputValue.length} / 4000</span>
                  <button className="send-btn" disabled={!inputValue.trim() || isStreaming} onClick={() => submitMessage(inputValue)}>
                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`toast ${toastShow ? "show" : ""}`}>{toastMsg}</div>
    </>
  );
}
