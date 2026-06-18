"use client";

import React, { useState, useEffect, useRef } from "react";
import "./nova.css";
import PracticeMode from "./PracticeMode";

declare global {
  interface Window {
    marked: any;
    hljs: any;
  }
}

interface Person {
  id: string;
  name: string;
  emoji: string;
  gender: 'she' | 'he' | 'they';
  personality: 'nova' | 'scholar' | 'sage' | 'spark';
  relationship: 'girlfriend' | 'bestfriend' | 'classmate' | 'crush' | 'situationship';
  language: 'english' | 'hinglish';
  createdAt: string;
}

export default function NovaApp() {
  const [isMounted, setIsMounted] = useState(false);

  // Auth
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authUsernameError, setAuthUsernameError] = useState("");
  const [authPasswordError, setAuthPasswordError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);

  const [userName, setUserName] = useState("");
  const [userGender, setUserGender] = useState<"male" | "female" | "">("");

  // Persons & Chats
  const [persons, setPersons] = useState<Person[]>([]);
  const [activePersonId, setActivePersonId] = useState<string | null>(null);
  const [chatMap, setChatMap] = useState<Record<string, string>>({});
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [practiceModeOpen, setPracticeModeOpen] = useState(false);
  
  // App UI state
  const [inputValue, setInputValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState("default");
  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);

  // Create Person Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [cpEmoji, setCpEmoji] = useState("👩");
  const [cpName, setCpName] = useState("");
  const [cpGender, setCpGender] = useState<"she" | "he" | "they">("she");
  const [cpPersonality, setCpPersonality] = useState<"nova" | "scholar" | "sage" | "spark">("nova");
  const [cpRelationship, setCpRelationship] = useState<"girlfriend" | "bestfriend" | "classmate" | "crush" | "situationship">("girlfriend");
  const [cpLanguage, setCpLanguage] = useState<"english" | "hinglish">("english");
  const [cpCreating, setCpCreating] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollFabRef = useRef<HTMLButtonElement>(null);
  const userIdRef = useRef<string>("");

  useEffect(() => {
    setIsMounted(true);
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

    const handleCopy = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains('code-copy-btn')) {
        const code = target.getAttribute('data-code');
        if (code) {
          navigator.clipboard.writeText(code);
          const orig = target.innerText;
          target.innerText = "Copied!";
          setTimeout(() => { target.innerText = orig; }, 2000);
        }
      }
    };
    document.addEventListener('click', handleCopy);
    return () => document.removeEventListener('click', handleCopy);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("nova_user");
    const savedUserId = localStorage.getItem("nova_userId");
    if (savedUser && savedUserId) {
      setLoggedInUser(savedUser);
      userIdRef.current = savedUserId;
      initAfterAuth();
    }
  }, []);

  useEffect(() => {
    if (theme === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
    localStorage.setItem("nova_theme", theme);
  }, [theme]);

  const initAfterAuth = async () => {
    const savedTheme = localStorage.getItem("nova_theme");
    if (savedTheme) setTheme(savedTheme);

    try {
      const [personsRes, chatsRes, settingsRes] = await Promise.all([
        fetch("/api/persons", { headers: { "x-user-id": userIdRef.current } }),
        fetch("/api/chats", { headers: { "x-user-id": userIdRef.current } }),
        fetch("/api/user/settings", { headers: { "x-user-id": userIdRef.current } })
      ]);

      const personsData = await personsRes.json();
      const chatsData = await chatsRes.json();
      const settingsData = await settingsRes.json();

      if (settingsData.settings) {
        setUserName(settingsData.settings.name || "");
        setUserGender(settingsData.settings.gender || "");
      }

      const loadedPersons = personsData.persons || [];
      const loadedChats = chatsData.chats || [];

      setPersons(loadedPersons);
      
      const newChatMap: Record<string, string> = {};
      loadedChats.forEach((c: any) => {
        if (c.personId) newChatMap[c.personId] = c.id;
      });
      setChatMap(newChatMap);

      if (loadedPersons.length > 0) {
        const savedActive = localStorage.getItem("nova_active_person_id");
        if (savedActive && loadedPersons.find((p: any) => p.id === savedActive)) {
          setActivePersonId(savedActive);
          loadChatForPerson(savedActive, newChatMap);
        } else {
          setActivePersonId(loadedPersons[0].id);
          loadChatForPerson(loadedPersons[0].id, newChatMap);
        }
      }
    } catch (e) {
      console.error("Boot error:", e);
    }
  };

  const loadChatForPerson = async (personId: string, currentChatMap: Record<string, string>) => {
    let chatId = currentChatMap[personId];
    if (!chatId) {
      try {
        const res = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-id": userIdRef.current },
          body: JSON.stringify({ personId })
        });
        const data = await res.json();
        if (data.chat) {
          chatId = data.chat.id;
          setChatMap(prev => ({ ...prev, [personId]: chatId }));
        }
      } catch (e) {
        console.error("Failed to create chat for person");
        return;
      }
    }
    
    if (chatId) {
      setCurrentChatId(chatId);
      try {
        const res = await fetch(`/api/chats/${chatId}/messages`, {
          headers: { "x-user-id": userIdRef.current }
        });
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        } else {
          setMessages([]);
        }
      } catch (e) {
        console.error("Failed to fetch messages");
        setMessages([]);
      }
    }
  };

  const switchPerson = (personId: string) => {
    setActivePersonId(personId);
    localStorage.setItem("nova_active_person_id", personId);
    setSidebarOpen(false);
    loadChatForPerson(personId, chatMap);
  };

  const createPerson = async () => {
    if (!cpName.trim() || cpCreating) return;
    setCpCreating(true);
    try {
      const res = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userIdRef.current },
        body: JSON.stringify({
          name: cpName, emoji: cpEmoji, gender: cpGender,
          personality: cpPersonality, relationship: cpRelationship, language: cpLanguage
        })
      });
      const data = await res.json();
      if (data.person) {
        setPersons(prev => [...prev, data.person]);
        switchPerson(data.person.id);
        setCreateModalOpen(false);
        setCpName("");
        setCpEmoji("👩");
        showToast("Person created!");
      } else {
        alert(data.error || "Failed to create person");
      }
    } catch (e) {
      alert("Error creating person");
    }
    setCpCreating(false);
  };

  const deleteCurrentPerson = async () => {
    if (!activePersonId) return;
    if (!confirm("Are you sure? This will delete this person and all your chat history with them. This cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/persons/${activePersonId}`, {
        method: "DELETE",
        headers: { "x-user-id": userIdRef.current }
      });
      if (res.ok) {
        const newPersons = persons.filter(p => p.id !== activePersonId);
        setPersons(newPersons);
        showToast("Person deleted");
        setSettingsOpen(false);
        if (newPersons.length > 0) {
          switchPerson(newPersons[0].id);
        } else {
          setActivePersonId(null);
          setCurrentChatId(null);
          setMessages([]);
        }
      }
    } catch (e) {
      alert("Failed to delete person");
    }
  };

  // Auth Handling
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(""); setAuthUsernameError(""); setAuthPasswordError("");
    const u = authUsername.trim();
    if (u.length < 3) { setAuthUsernameError("Username must be at least 3 characters."); return; }
    if (authPassword.length < 6) { setAuthPasswordError("Password must be at least 6 characters."); return; }
    
    setAuthLoading(true);
    try {
      const res = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: authPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.toLowerCase().includes("username")) setAuthUsernameError(data.error);
        else if (data.error?.toLowerCase().includes("password")) setAuthPasswordError(data.error);
        else setAuthError(data.error || "Authentication failed");
      } else {
        localStorage.setItem("nova_user", data.user.username);
        localStorage.setItem("nova_userId", data.user.id);
        setLoggedInUser(data.user.username);
        userIdRef.current = data.user.id;
        initAfterAuth();
      }
    } catch (e) {
      setAuthError("Network error. Please try again.");
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("nova_user");
    localStorage.removeItem("nova_userId");
    setLoggedInUser(null);
    userIdRef.current = "";
    setPersons([]);
    setMessages([]);
    setChatMap({});
    setActivePersonId(null);
    setCurrentChatId(null);
    setTheme("default");
    document.documentElement.removeAttribute("data-theme");
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastShow(true);
    setTimeout(() => setToastShow(false), 3000);
  };

  const scrollToBottom = (smooth = true) => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: smooth ? "smooth" : "auto"
    });
  };

  useEffect(() => {
    if (messages.length > 0 || streamedText) scrollToBottom(true);
  }, [messages, streamedText]);

  // Handle scroll fab visibility
  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (!scrollFabRef.current) return;
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distFromBottom > 150) scrollFabRef.current.classList.add("show");
      else scrollFabRef.current.classList.remove("show");
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSend = async () => {
    if ((!inputValue.trim() && !streamedText) || isStreaming || !currentChatId || !activePersonId) return;
    
    const userText = inputValue.trim();
    setInputValue("");
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.focus();
    }

    const newMsg = { role: "user", content: userText, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, newMsg]);
    setIsStreaming(true);
    setStreamedText("");
    scrollToBottom();

    try {
      // 1. Save user msg
      await fetch(`/api/chats/${currentChatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userIdRef.current },
        body: JSON.stringify({ role: "user", content: userText })
      });

      // 2. Stream AI response
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userIdRef.current },
        body: JSON.stringify({
          messages: [...messages, newMsg].map(m => ({ role: m.role, content: m.content })),
          personId: activePersonId,
          userName,
          userGender
        })
      });

      if (!res.ok) throw new Error("API Error");
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

      // 3. Save assistant msg
      await fetch(`/api/chats/${currentChatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userIdRef.current },
        body: JSON.stringify({ role: "assistant", content: fullResponse })
      });

      setMessages(prev => [...prev, { role: "assistant", content: fullResponse, createdAt: new Date().toISOString() }]);
      setStreamedText("");
    } catch (error) {
      console.error("Chat error:", error);
      showToast("Message failed to send.");
    } finally {
      setIsStreaming(false);
      scrollToBottom();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activePerson = persons.find(p => p.id === activePersonId);

  if (!isMounted) return null;

  return (
    <>
      <div className="aurora">
        <div className="aurora-blob ab1"></div>
        <div className="aurora-blob ab2"></div>
        <div className="aurora-blob ab3"></div>
      </div>

      <div className={`toast ${toastShow ? "show" : ""}`}>{toastMsg}</div>

      {/* Auth Gate */}
      {!loggedInUser && (
        <div className="auth-gate">
          <div className="auth-card">
            <div className="auth-logo">🩷</div>
            <div className="auth-title">Nova</div>
            <div className="auth-sub">your ai companion</div>
            
            <div className="auth-tabs">
              <button className={`auth-tab ${authMode === "login" ? "active" : ""}`} onClick={() => { setAuthMode("login"); setAuthError(""); setAuthUsernameError(""); setAuthPasswordError(""); }}>Log In</button>
              <button className={`auth-tab ${authMode === "register" ? "active" : ""}`} onClick={() => { setAuthMode("register"); setAuthError(""); setAuthUsernameError(""); setAuthPasswordError(""); }}>Register</button>
            </div>
            
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authError && <div className="auth-error">{authError}</div>}
              
              <div className="auth-field">
                <label>Username</label>
                <input 
                  type="text" 
                  placeholder="Enter username" 
                  value={authUsername} 
                  onChange={e => setAuthUsername(e.target.value)}
                  disabled={authLoading}
                  style={authUsernameError ? { borderColor: 'rgba(248,113,113,0.5)' } : {}}
                />
                {authUsernameError && <div style={{color: 'var(--red)', fontSize: '11px', marginTop: '-3px'}}>{authUsernameError}</div>}
              </div>
              
              <div className="auth-field">
                <label>Password</label>
                <input 
                  type="password" 
                  placeholder="Enter password" 
                  value={authPassword} 
                  onChange={e => setAuthPassword(e.target.value)}
                  disabled={authLoading}
                  style={authPasswordError ? { borderColor: 'rgba(248,113,113,0.5)' } : {}}
                />
                {authPasswordError && <div style={{color: 'var(--red)', fontSize: '11px', marginTop: '-3px'}}>{authPasswordError}</div>}
              </div>
              
              <button type="submit" className="auth-submit" disabled={authLoading || !authUsername || !authPassword}>
                {authLoading ? "Please wait..." : (authMode === "login" ? "Log In ➔" : "Create Account ➔")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Person Modal */}
      {createModalOpen && (
        <div className="auth-gate" style={{ zIndex: 400 }}>
          <div className="auth-card" style={{ maxWidth: 460, padding: "30px" }}>
            <div className="sp-head" style={{ borderBottom: 'none', padding: '0 0 16px', width: '100%' }}>
              <div className="sp-title">Create Person</div>
              <button className="sp-close" onClick={() => setCreateModalOpen(false)}>✕</button>
            </div>
            
            <div style={{ width: '100%', maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
              <div className="auth-field" style={{ marginBottom: 16 }}>
                <label>Avatar Emoji</label>
                <input type="text" value={cpEmoji} onChange={e => setCpEmoji(e.target.value)} placeholder="👩" maxLength={4} style={{ fontSize: 24, textAlign: 'center', padding: '8px' }} />
              </div>
              
              <div className="auth-field" style={{ marginBottom: 16 }}>
                <label>Name</label>
                <input type="text" value={cpName} onChange={e => setCpName(e.target.value)} placeholder="Name..." maxLength={20} />
              </div>

              <div className="auth-field" style={{ marginBottom: 16 }}>
                <label>Gender</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['she', 'he', 'they'].map(g => (
                    <button key={g} className={`lang-pill ${cpGender === g ? 'active' : ''}`} onClick={() => setCpGender(g as any)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="auth-field" style={{ marginBottom: 16 }}>
                <label>Personality</label>
                <div className="persona-grid">
                  {[
                    { id: 'nova', name: 'Nova', icon: '🩷', desc: 'Warm companion' },
                    { id: 'scholar', name: 'Scholar', icon: '📚', desc: 'Study buddy' },
                    { id: 'sage', name: 'Sage', icon: '🌿', desc: 'Wise guide' },
                    { id: 'spark', name: 'Spark', icon: '⚡', desc: 'Creative chaos' }
                  ].map(p => (
                    <div key={p.id} className={`persona-card ${cpPersonality === p.id ? 'active' : ''}`} onClick={() => setCpPersonality(p.id as any)}>
                      <span className="pc-icon">{p.icon}</span>
                      <span className="pc-name">{p.name}</span>
                      <span className="pc-desc">{p.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="auth-field" style={{ marginBottom: 16 }}>
                <label>Relationship Vibe</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {['girlfriend', 'bestfriend', 'classmate', 'crush', 'situationship'].map(r => (
                    <button key={r} className={`lang-pill ${cpRelationship === r ? 'active' : ''}`} onClick={() => setCpRelationship(r as any)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="auth-field" style={{ marginBottom: 24 }}>
                <label>Language</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['english', 'hinglish'].map(l => (
                    <button key={l} className={`lang-pill ${cpLanguage === l ? 'active' : ''}`} onClick={() => setCpLanguage(l as any)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              
              <button className="auth-submit" disabled={!cpName.trim() || cpCreating} onClick={createPerson}>
                {cpCreating ? "Creating..." : "Create Person"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      <div className={`settings-overlay ${settingsOpen ? "open" : ""}`} onClick={() => setSettingsOpen(false)}></div>
      <div className={`settings-panel ${settingsOpen ? "open" : ""}`}>
        <div className="sp-head">
          <div className="sp-title">Settings</div>
          <button className="sp-close" onClick={() => setSettingsOpen(false)}>✕</button>
        </div>
        <div className="sp-body">
          <div className="sp-section">
            <div className="sp-label">Theme</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'default', name: 'Default Dark', icon: '🌌' },
                { id: 'instagram', name: 'Instagram', icon: '📸' },
                { id: 'whatsapp', name: 'WhatsApp', icon: '💬' },
                { id: 'imessage', name: 'iMessage', icon: '🍏' }
              ].map(t => (
                <button 
                  key={t.id} 
                  className={`lang-pill ${theme === t.id ? 'active' : ''}`}
                  onClick={() => setTheme(t.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 14, fontWeight: 500, textAlign: 'left' }}
                >
                  <span style={{ fontSize: 20 }}>{t.icon}</span> {t.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="sp-section">
            <div className="sp-label">Account</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activePersonId && (
                <button className="danger-btn" onClick={deleteCurrentPerson}>🗑️ Delete Current Person</button>
              )}
              <button className="danger-btn" onClick={handleLogout}>🚪 Sign Out</button>
            </div>
          </div>
        </div>
      </div>

      <div className="app-wrapper">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarOpen ? "open" : ""}`} id="sidebar">
          <div className="sidebar-head">
            <div className="sidebar-title">Persons</div>
            <button className="sidebar-new" onClick={() => { setCreateModalOpen(true); setSidebarOpen(false); }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14m-7-7h14"/></svg> Add
            </button>
          </div>
          <div className="sidebar-list">
            {persons.map(p => (
              <div key={p.id} className={`sidebar-chat ${activePersonId === p.id ? "active" : ""}`} onClick={() => switchPerson(p.id)}>
                <div className="sidebar-chat-icon" style={{ background: 'transparent', fontSize: 22, boxShadow: 'none' }}>{p.emoji}</div>
                <div className="sidebar-chat-info">
                  <div className="sidebar-chat-title">{p.name}</div>
                  <div className="sidebar-chat-meta">{p.relationship}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)}></div>
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>

        <div className="app">
          {/* IG Story Row (only visible in instagram theme via CSS, and replaces sidebar) */}
          {theme === "instagram" && persons.length > 0 && (
            <div className="ig-story-row">
              {persons.map(p => (
                <div key={p.id} className="ig-story-item" onClick={() => switchPerson(p.id)}>
                  <div className="ig-story-ring" style={activePersonId === p.id ? {} : { background: 'var(--border)' }}>
                    <div className="ig-story-inner">{p.emoji}</div>
                  </div>
                  <div className="ig-story-name" style={activePersonId === p.id ? { fontWeight: 600 } : {}}>{p.name}</div>
                </div>
              ))}
              <div className="ig-story-item" onClick={() => setCreateModalOpen(true)}>
                <div className="ig-story-ring" style={{ background: 'transparent', border: '1px dashed var(--text-3)', padding: 0 }}>
                  <div className="ig-story-inner" style={{ fontSize: 18, color: 'var(--text-2)' }}>+</div>
                </div>
                <div className="ig-story-name">Add</div>
              </div>
            </div>
          )}

          {/* Topbar */}
          {activePerson && (
            <div className="topbar">
              <div className="nova-av-wrap">
                <div className="nova-av" style={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 20, boxShadow: 'none' }}>
                  {activePerson.emoji}
                </div>
                <div className="online-ring"></div>
                <div className="online-dot"></div>
              </div>
              <div className="nova-info">
                <div className="nova-name">{activePerson.name}</div>
                <div className="nova-status">
                  <span className="ns-dot"></span>
                  <span>online</span>
                </div>
              </div>
              <div className="topbar-btns">
                <button className="tbtn" style={{ fontSize: 13, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 12, marginRight: 8 }} onClick={() => setPracticeModeOpen(true)}>🎯 Practice</button>
                <button className="tbtn" onClick={() => setSettingsOpen(true)}>⚙️</button>
              </div>
            </div>
          )}

          {/* Chat Area */}
          <div className="chat-area" ref={chatContainerRef}>
            {persons.length === 0 ? (
              <div className="welcome">
                <div className="welcome-orb" style={{ background: 'transparent', fontSize: 60, boxShadow: 'none', animation: 'none' }}>🥺</div>
                <div className="welcome-title">No one here yet</div>
                <div className="welcome-sub">Create your first person to start chatting.</div>
                <button className="ob-start-btn" style={{ maxWidth: 200 }} onClick={() => setCreateModalOpen(true)}>+ Add Person</button>
              </div>
            ) : (
              <>
                {messages.length === 0 && !streamedText && activePerson && (
                  <div className="welcome">
                    <div className="welcome-orb" style={{ background: 'transparent', fontSize: 60, boxShadow: 'none', animation: 'none' }}>{activePerson.emoji}</div>
                    <div className="welcome-title">Say hi to {activePerson.name}</div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`msg-row ${msg.role === "user" ? "user" : "nova"}`}>
                    <div className="msg-inner">
                      <div className={`msg-av ${msg.role === "user" ? "user-av" : "nova-av"}`} style={msg.role !== "user" ? { background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 16, boxShadow: 'none' } : {}}>
                        {msg.role === "user" ? "U" : activePerson?.emoji}
                      </div>
                      <div className="msg-body">
                        <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: window.marked ? window.marked.parse(msg.content) : msg.content }} />
                      </div>
                    </div>
                  </div>
                ))}

                {isStreaming && streamedText && (
                  <div className="msg-row nova">
                    <div className="msg-inner">
                      <div className="msg-av nova-av" style={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 16, boxShadow: 'none' }}>{activePerson?.emoji}</div>
                      <div className="msg-body">
                        <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: window.marked ? window.marked.parse(streamedText) : streamedText }} />
                      </div>
                    </div>
                  </div>
                )}

                {isStreaming && !streamedText && (
                  <div className="typing-row">
                    <div className="typing-inner">
                      <div className="msg-av nova-av" style={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 16, boxShadow: 'none' }}>{activePerson?.emoji}</div>
                      <div className="typing-bubble">
                        <div className="td"></div><div className="td"></div><div className="td"></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input Area */}
          {persons.length > 0 && activePerson && (
            <div className="input-zone">
              <div className="input-card">
                <div className="input-bar">
                  <textarea
                    ref={inputRef}
                    placeholder={`Message ${activePerson.name}...`}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
                    }}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                  <div className="input-right">
                    <button className="send-btn" disabled={!inputValue.trim() || isStreaming} onClick={handleSend}>
                      <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <button ref={scrollFabRef} className="scroll-fab" onClick={() => scrollToBottom(true)}>↓</button>
        </div>
      </div>
      
      {practiceModeOpen && activePerson && (
        <PracticeMode 
          personId={activePerson.id} 
          userId={userIdRef.current} 
          activePerson={activePerson}
          onClose={() => setPracticeModeOpen(false)} 
        />
      )}
    </>
  );
}
