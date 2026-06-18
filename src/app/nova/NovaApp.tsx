"use client";

import React, { useState, useEffect, useRef } from "react";
import "./nova.css";
import PracticeMode from "./PracticeMode";
import { Avatar } from "./Avatar";
import { compressImage } from "./utils";

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
  avatar?: string;
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
  const [cpAvatar, setCpAvatar] = useState<string | null>(null);
  const [cpName, setCpName] = useState("");
  const [cpGender, setCpGender] = useState<"she" | "he" | "they">("she");
  const [cpPersonality, setCpPersonality] = useState<"nova" | "scholar" | "sage" | "spark">("nova");
  const [cpRelationship, setCpRelationship] = useState<"girlfriend" | "bestfriend" | "classmate" | "crush" | "situationship">("girlfriend");
  const [cpLanguage, setCpLanguage] = useState<"english" | "hinglish">("english");
  const [cpCreating, setCpCreating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsFileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setLoggedInUser(data.username);
          userIdRef.current = data.userId;
          initAfterAuth();
        }
      } catch (e) {
        // Not logged in
      }
    };
    checkSession();
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
        fetch("/api/persons", { headers: { } }),
        fetch("/api/chats", { headers: { } }),
        fetch("/api/user/settings", { headers: { } })
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
          headers: { "Content-Type": "application/json" },
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
          headers: { }
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

  const handleCpAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await compressImage(e.target.files[0]);
        setCpAvatar(base64);
      } catch (error) {
        alert("Failed to compress image");
      }
    }
  };

  const handleSettingsAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activePersonId) {
      try {
        const base64 = await compressImage(e.target.files[0]);
        const res = await fetch(`/api/persons/${activePersonId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarBase64: base64 })
        });
        const data = await res.json();
        if (data.person) {
          setPersons(prev => prev.map(p => p.id === activePersonId ? { ...p, avatar: base64 } : p));
          showToast("Avatar updated");
        }
      } catch (error) {
        alert("Failed to upload avatar");
      }
    }
  };

  const createPerson = async () => {
    if (!cpName.trim() || cpCreating) return;
    setCpCreating(true);
    try {
      const res = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cpName, 
          emoji: cpEmoji, 
          gender: cpGender,
          personality: cpPersonality, 
          relationship: cpRelationship, 
          language: cpLanguage,
          avatarBase64: cpAvatar
        })
      });
      const data = await res.json();
      if (data.person) {
        setPersons(prev => [...prev, data.person]);
        switchPerson(data.person.id);
        setCreateModalOpen(false);
        setCpName("");
        setCpEmoji("👩");
        setCpAvatar(null);
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
        method: "DELETE"
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
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          setLoggedInUser(meData.username);
          userIdRef.current = meData.userId;
          initAfterAuth();
        } else {
          setAuthError("Failed to verify session. Please try again.");
        }
      }
    } catch (e) {
      setAuthError("Network error. Please try again.");
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", content: userText })
      });

      // 2. Stream AI response
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
      <div className={`toast ${toastShow ? "show" : ""}`}>{toastMsg}</div>

      {/* Auth Gate */}
      {!loggedInUser && (
        <div className="auth-gate">
          <div className="auth-card">
            <div className="auth-logo" style={{ fontSize: 36, marginBottom: 16 }}>🩷</div>
            <div className="auth-title" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 800, background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>Nova</div>
            <div className="auth-sub" style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 32 }}>your premium ai companion</div>
            
            <div className="auth-tabs" style={{ display: 'flex', width: '100%', background: 'var(--surface-2)', padding: 4, borderRadius: 12, marginBottom: 24 }}>
              <button className={`auth-tab ${authMode === "login" ? "active" : ""}`} onClick={() => { setAuthMode("login"); setAuthError(""); setAuthUsernameError(""); setAuthPasswordError(""); }} style={{ flex: 1, padding: '10px 0', border: 'none', background: authMode === 'login' ? 'var(--surface-3)' : 'transparent', color: authMode === 'login' ? 'var(--text-1)' : 'var(--text-3)', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Log In</button>
              <button className={`auth-tab ${authMode === "register" ? "active" : ""}`} onClick={() => { setAuthMode("register"); setAuthError(""); setAuthUsernameError(""); setAuthPasswordError(""); }} style={{ flex: 1, padding: '10px 0', border: 'none', background: authMode === 'register' ? 'var(--surface-3)' : 'transparent', color: authMode === 'register' ? 'var(--text-1)' : 'var(--text-3)', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Register</button>
            </div>
            
            <form className="auth-form" onSubmit={handleAuthSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {authError && <div className="auth-error" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '12px', borderRadius: 8, fontSize: 13, textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{authError}</div>}
              
              <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
                <input 
                  type="text" 
                  placeholder="Enter username" 
                  value={authUsername} 
                  onChange={e => setAuthUsername(e.target.value)}
                  disabled={authLoading}
                  style={{ width: '100%', padding: '14px 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-1)', fontSize: 15, ...authUsernameError ? { borderColor: '#EF4444' } : {} }}
                />
                {authUsernameError && <div style={{color: '#EF4444', fontSize: '11px', marginTop: '-2px'}}>{authUsernameError}</div>}
              </div>
              
              <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                <input 
                  type="password" 
                  placeholder="Enter password" 
                  value={authPassword} 
                  onChange={e => setAuthPassword(e.target.value)}
                  disabled={authLoading}
                  style={{ width: '100%', padding: '14px 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-1)', fontSize: 15, ...authPasswordError ? { borderColor: '#EF4444' } : {} }}
                />
                {authPasswordError && <div style={{color: '#EF4444', fontSize: '11px', marginTop: '-2px'}}>{authPasswordError}</div>}
              </div>
              
              <button type="submit" className="m-submit" disabled={authLoading || !authUsername || !authPassword} style={{ marginTop: 8 }}>
                {authLoading ? "Please wait..." : (authMode === "login" ? "Log In ➔" : "Create Account ➔")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Person Modal */}
      <div className={`modal-overlay ${createModalOpen ? "open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setCreateModalOpen(false); }}>
        <div className="modal-card">
          <div className="mh-head">
            <h2>Create Person</h2>
            <button className="m-close" onClick={() => setCreateModalOpen(false)}>✕</button>
          </div>
          
          <div className="m-avatar-sec">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleCpAvatarUpload}
            />
            <div className="m-avatar-circle" onClick={() => fileInputRef.current?.click()}>
              {cpAvatar ? <img src={cpAvatar} alt="Avatar" /> : cpEmoji}
            </div>
            <div className="cam-badge" style={{ pointerEvents: 'none' }}>📷</div>
            <div className="m-avatar-hint">Tap to upload a photo</div>
          </div>
          
          <div className="m-section">
            <div className="m-label">Name</div>
            <input className="m-input" type="text" value={cpName} onChange={e => setCpName(e.target.value)} placeholder="E.g. Sarah" maxLength={20} />
          </div>

          <div className="m-section">
            <div className="m-label">Gender</div>
            <div className="m-pills-row">
              {['she', 'he', 'they'].map(g => (
                <button key={g} className={`m-pill m-pill-gender ${cpGender === g ? 'active' : ''}`} onClick={() => setCpGender(g as any)}>{g}</button>
              ))}
            </div>
          </div>

          <div className="m-section">
            <div className="m-label">Personality Type</div>
            <div className="m-grid">
              {[
                { id: 'nova', name: 'Nova', icon: '🩷', desc: 'Warm companion' },
                { id: 'scholar', name: 'Scholar', icon: '📚', desc: 'Study buddy' },
                { id: 'sage', name: 'Sage', icon: '🌿', desc: 'Wise guide' },
                { id: 'spark', name: 'Spark', icon: '⚡', desc: 'Creative chaos' }
              ].map(p => (
                <div key={p.id} className={`m-grid-card ${cpPersonality === p.id ? 'active' : ''}`} onClick={() => setCpPersonality(p.id as any)}>
                  <div className="mg-emoji">{p.icon}</div>
                  <div className="mg-name">{p.name}</div>
                  <div className="mg-desc">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="m-section">
            <div className="m-label">Relationship Mode</div>
            <div className="m-pills-row">
              {['girlfriend', 'bestfriend', 'classmate', 'crush', 'situationship'].map(r => (
                <button key={r} className={`m-pill ${cpRelationship === r ? 'active' : ''}`} onClick={() => setCpRelationship(r as any)}>{r}</button>
              ))}
            </div>
          </div>

          <div className="m-section" style={{ marginBottom: 32 }}>
            <div className="m-label">Language Preference</div>
            <div className="m-pills-row">
              {['english', 'hinglish'].map(l => (
                <button key={l} className={`m-pill m-pill-gender ${cpLanguage === l ? 'active' : ''}`} onClick={() => setCpLanguage(l as any)}>{l}</button>
              ))}
            </div>
          </div>
          
          <button className="m-submit" disabled={!cpName.trim() || cpCreating} onClick={createPerson}>
            {cpCreating ? "Creating..." : "Create Companion"}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <div className={`settings-overlay ${settingsOpen ? "open" : ""}`} onClick={() => setSettingsOpen(false)}></div>
      <div className={`settings-drawer ${settingsOpen ? "open" : ""}`}>
        <div className="sd-head">
          <h2>Settings</h2>
          <button className="sd-close" onClick={() => setSettingsOpen(false)}>✕</button>
        </div>
        
        <div className="sd-body">
          {activePerson && (
            <div className="sd-section">
              <div className="sd-label">Companion Avatar</div>
              <input 
                type="file" 
                accept="image/*" 
                ref={settingsFileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleSettingsAvatarUpload}
              />
              <div className="settings-av-zone" onClick={() => settingsFileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                <div className="av-edit-wrap">
                  <Avatar avatar={activePerson.avatar} name={activePerson.name} size={48} />
                  <div className="av-edit-badge">📷</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{activePerson.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Click to update photo</div>
                </div>
              </div>
            </div>
          )}

          <div className="sd-section">
            <div className="sd-label">App Theme</div>
            <div className="theme-grid">
              {[
                { id: 'default', name: 'Velvet Dark' },
                { id: 'instagram', name: 'Instagram' },
                { id: 'whatsapp', name: 'WhatsApp' },
                { id: 'imessage', name: 'iMessage' }
              ].map(t => (
                <div key={t.id} className={`theme-card ${theme === t.id ? 'active' : ''}`} onClick={() => setTheme(t.id)}>
                  <div className="theme-preview">
                    <div style={{ width: '60%', height: 6, background: 'var(--surface-3)', borderRadius: 3 }}></div>
                    <div style={{ width: '80%', height: 6, background: 'var(--surface-3)', borderRadius: 3 }}></div>
                    <div style={{ width: '40%', height: 6, background: 'var(--gradient, #555)', borderRadius: 3, marginLeft: 'auto', marginTop: 'auto' }}></div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }}>{t.name}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="sd-section" style={{ marginTop: 'auto' }}>
            <div className="sd-label">Account Management</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activePersonId && (
                <button className="sd-danger" onClick={deleteCurrentPerson}>Delete Current Person</button>
              )}
              <button className="sd-danger" onClick={handleLogout}>Sign Out</button>
            </div>
          </div>
        </div>
      </div>

      <div className="app-wrapper">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarOpen ? "open" : ""}`} id="sidebar">
          <div className="sidebar-head">
            <div className="sidebar-title">
              <span style={{ fontSize: 24 }}>✧</span> Nova
            </div>
          </div>
          <div className="sidebar-list">
            {persons.map(p => (
              <div key={p.id} className={`sidebar-chat ${activePersonId === p.id ? "active" : ""}`} onClick={() => switchPerson(p.id)}>
                <Avatar avatar={p.avatar} name={p.name} size={38} className="sidebar-chat-icon" />
                <div className="sidebar-chat-info">
                  <div className="sidebar-chat-title">{p.name}</div>
                  <div className="sidebar-chat-meta">{p.relationship}</div>
                </div>
                <div className="sidebar-chat-time">
                  {/* Mock time placeholder */}
                  Now
                </div>
              </div>
            ))}
          </div>
          <div className="sidebar-add-wrapper">
            <button className="sidebar-add-btn" onClick={() => { setCreateModalOpen(true); setSidebarOpen(false); }}>
              + Add Person
            </button>
          </div>
        </div>
        
        {sidebarOpen && <div className="sidebar-overlay open" onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}></div>}
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>

        <div className="app" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
          {/* IG Story Row (only visible in instagram theme via CSS, and replaces sidebar) */}
          {theme === "instagram" && persons.length > 0 && (
            <div className="ig-story-row" style={{ display: 'flex', gap: 16, padding: '16px 20px', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0, background: 'var(--bg)', scrollbarWidth: 'none' }}>
              {persons.map(p => (
                <div key={p.id} className="ig-story-item" onClick={() => switchPerson(p.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <div className="ig-story-ring" style={{ width: 64, height: 64, borderRadius: '50%', padding: 2, background: activePersonId === p.id ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="ig-story-inner" style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #fff', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <Avatar avatar={p.avatar} name={p.name} size={60} />
                    </div>
                  </div>
                  <div className="ig-story-name" style={{ fontSize: 11, color: 'var(--text-1)', fontWeight: activePersonId === p.id ? 600 : 400 }}>{p.name}</div>
                </div>
              ))}
            </div>
          )}

          {/* Topbar */}
          {activePerson && (
            <div className="topbar">
              <div className="nova-av-wrap">
                <Avatar avatar={activePerson.avatar} name={activePerson.name} size={40} className="nova-av" />
              </div>
              <div className="nova-info">
                <div className="nova-name">{activePerson.name}</div>
                <div className="nova-status">
                  <span className="ns-dot"></span>
                  <span>online · always here</span>
                </div>
              </div>
              <div className="topbar-btns">
                <button className="tbtn" style={{ fontSize: 13, padding: '0 12px', border: '1px solid var(--border)', borderRadius: 18, width: 'auto' }} onClick={() => setPracticeModeOpen(true)}>🎯 Practice</button>
                <button className="tbtn" onClick={() => setSettingsOpen(true)}>⚙️</button>
              </div>
            </div>
          )}

          {/* Chat Area */}
          <div className="chat-area" ref={chatContainerRef}>
            {persons.length === 0 ? (
              <div className="welcome" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '32px 24px', animation: 'msgIn 0.5s ease both' }}>
                <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, border: '1px dashed var(--border)' }}>✨</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--text-1)', textAlign: 'center' }}>No one here yet</div>
                <div style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>Create your first companion to start building a connection.</div>
                <button className="m-submit" style={{ maxWidth: 200, marginTop: 12 }} onClick={() => setCreateModalOpen(true)}>+ Add Person</button>
              </div>
            ) : (
              <>
                {messages.length === 0 && !streamedText && activePerson && (
                  <div className="welcome" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '40px 24px' }}>
                    <Avatar avatar={activePerson.avatar} name={activePerson.name} size={80} className="welcome-orb" />
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>Say hi to {activePerson.name}</div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`msg-row ${msg.role === "user" ? "user" : "nova"}`}>
                    <div className="msg-inner">
                      {msg.role !== "user" && <Avatar avatar={activePerson?.avatar} name={activePerson?.name || "Nova"} size={28} className="msg-av" />}
                      <div className="msg-body">
                        {msg.role !== "user" && <div className="msg-meta">{activePerson?.name}</div>}
                        <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: window.marked ? window.marked.parse(msg.content) : msg.content }} />
                      </div>
                    </div>
                  </div>
                ))}

                {isStreaming && streamedText && (
                  <div className="msg-row nova">
                    <div className="msg-inner">
                      <Avatar avatar={activePerson?.avatar} name={activePerson?.name || "Nova"} size={28} className="msg-av" />
                      <div className="msg-body">
                        <div className="msg-meta">{activePerson?.name}</div>
                        <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: window.marked ? window.marked.parse(streamedText) : streamedText }} />
                      </div>
                    </div>
                  </div>
                )}

                {isStreaming && !streamedText && (
                  <div className="msg-row nova">
                    <div className="msg-inner">
                      <Avatar avatar={activePerson?.avatar} name={activePerson?.name || "Nova"} size={28} className="msg-av" />
                      <div className="msg-body">
                        <div className="typing-bubble">
                          <div className="td"></div><div className="td"></div><div className="td"></div>
                        </div>
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
              <div className="input-inner">
                <div className="input-card">
                  <textarea
                    ref={inputRef}
                    placeholder={`Message ${activePerson.name}...`}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                    }}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                  <div className="input-bottom">
                    <div className="char-ct">{inputValue.length}/2000</div>
                    <button className="send-btn" disabled={!inputValue.trim() || isStreaming} onClick={handleSend}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
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
