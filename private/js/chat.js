/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - AI CHAT MODULE
 * Persistent chat interface with memory integration
 * ═══════════════════════════════════════════════════════════
 */

const PSChat = (function() {
  'use strict';

  let _messages = [];
  let _currentSessionId = null;
  let _sessions = [];
  let _isTyping = false;

  /**
   * Load chat view
   */
  async function load() {
    await loadSessions();
    
    if (!_currentSessionId && _sessions.length > 0) {
      _currentSessionId = _sessions[0].id;
    }

    if (_currentSessionId) {
      await loadMessages(_currentSessionId);
    }

    render();
  }

  /**
   * Load all sessions
   */
  async function loadSessions() {
    try {
      const allMessages = await PSStorage.getAll(PSStorage.STORES.CHAT);
      const sessionMap = new Map();

      allMessages.forEach(msg => {
        if (!sessionMap.has(msg.sessionId)) {
          sessionMap.set(msg.sessionId, {
            id: msg.sessionId,
            name: msg.sessionName || 'New Chat',
            tags: msg.sessionTags || [],
            lastMessage: msg.createdAt,
            messageCount: 0
          });
        }
        const session = sessionMap.get(msg.sessionId);
        session.messageCount++;
        if (msg.createdAt > session.lastMessage) {
          session.lastMessage = msg.createdAt;
        }
      });

      _sessions = Array.from(sessionMap.values())
        .sort((a, b) => b.lastMessage - a.lastMessage);
    } catch {
      _sessions = [];
    }
  }

  /**
   * Load messages for a session
   */
  async function loadMessages(sessionId) {
    try {
      _messages = await PSStorage.getByIndex(PSStorage.STORES.CHAT, 'sessionId', sessionId);
      _messages.sort((a, b) => a.createdAt - b.createdAt);
    } catch {
      _messages = [];
    }
  }

  /**
   * Render chat interface
   */
  function render() {
    const container = document.querySelector('#section-chat .ps-workspace');
    if (!container) return;

    container.innerHTML = `
      <div class="ps-chat">
        <div class="ps-chat-sessions">
          <div class="ps-session-list">
            <button class="ps-session-tag" onclick="PSChat.newSession()">
              <svg class="icon-sm" viewBox="0 0 24 24" style="width: 12px; height: 12px; margin-right: 4px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New
            </button>
            ${_sessions.map(session => `
              <button class="ps-session-tag ${session.id === _currentSessionId ? 'active' : ''}" 
                      onclick="PSChat.switchSession('${session.id}')"
                      title="${session.messageCount} messages">
                ${escapeHtml(session.name)}
              </button>
            `).join('')}
          </div>
        </div>
        
        <div class="ps-chat-messages" id="chatMessages">
          ${renderMessages()}
        </div>
        
        <div class="ps-chat-input-container">
          <div class="ps-chat-context" id="chatContext" style="display: none;">
            <div class="ps-chat-context-title">Context</div>
            <div class="ps-chat-context-items" id="chatContextItems"></div>
          </div>
          <div class="ps-chat-input-wrapper">
            <textarea class="ps-chat-textarea" id="chatInput" placeholder="Message..." rows="1" 
                      onkeydown="PSChat.handleKeydown(event)"
                      oninput="PSChat.autoResize(this)"></textarea>
            <button class="ps-chat-send" id="chatSend" onclick="PSChat.send()">
              <svg class="icon-sm" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div class="ps-chat-tools">
            <button class="ps-chat-tool" onclick="PSChat.attachNote()">
              <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Add Note
            </button>
            <button class="ps-chat-tool" onclick="PSChat.showMemory()">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              Memory
            </button>
          </div>
        </div>
      </div>
    `;

    scrollToBottom();
  }

  /**
   * Render messages
   */
  function renderMessages() {
    if (_messages.length === 0) {
      return `
        <div class="ps-empty">
          <svg class="ps-empty-icon icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <h4 class="ps-empty-title">Start a conversation</h4>
          <p class="ps-empty-description">Ask me anything. I can help with notes, ideas, and more.</p>
        </div>
      `;
    }

    let html = _messages.map(msg => `
      <div class="ps-message ps-message-${msg.role} ${msg.pinned ? 'pinned' : ''}" data-id="${msg.id}">
        <div class="ps-message-avatar">
          ${msg.role === 'user' 
            ? '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
            : '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>'}
        </div>
        <div class="ps-message-content">
          <div class="ps-message-bubble">${formatMessage(msg.content)}</div>
          <div class="ps-message-meta">
            <span>${formatTime(msg.createdAt)}</span>
            <div class="ps-message-actions">
              <button class="ps-message-action ${msg.pinned ? 'pinned' : ''}" title="${msg.pinned ? 'Unpin' : 'Pin'}" onclick="PSChat.togglePin('${msg.id}')">
                <svg viewBox="0 0 24 24"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4.76z"/></svg>
              </button>
              <button class="ps-message-action" title="Copy" onclick="PSChat.copyMessage('${msg.id}')">
                <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    if (_isTyping) {
      html += `
        <div class="ps-message ps-message-assistant">
          <div class="ps-message-avatar">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <div class="ps-message-content">
            <div class="ps-typing">
              <div class="ps-typing-dots">
                <div class="ps-typing-dot"></div>
                <div class="ps-typing-dot"></div>
                <div class="ps-typing-dot"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return html;
  }

  /**
   * Send message
   */
  async function send() {
    const input = document.getElementById('chatInput');
    const content = input?.value.trim();

    if (!content) return;

    // Create session if needed
    if (!_currentSessionId) {
      _currentSessionId = PSCrypto.generateId();
    }

    // Save user message
    const userMessage = {
      id: PSCrypto.generateId(),
      sessionId: _currentSessionId,
      sessionName: _sessions.find(s => s.id === _currentSessionId)?.name || 'New Chat',
      role: 'user',
      content,
      createdAt: Date.now()
    };

    await PSStorage.save(PSStorage.STORES.CHAT, userMessage);
    _messages.push(userMessage);

    // Add to short-term memory
    PSMemory.addShortTerm('user_message', content, 'chat');

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Re-render
    render();

    // Generate AI response
    _isTyping = true;
    updateMessages();

    try {
      const response = await generateResponse(content);
      
      const assistantMessage = {
        id: PSCrypto.generateId(),
        sessionId: _currentSessionId,
        sessionName: _sessions.find(s => s.id === _currentSessionId)?.name || 'New Chat',
        role: 'assistant',
        content: response.text,
        createdAt: Date.now()
      };

      await PSStorage.save(PSStorage.STORES.CHAT, assistantMessage);
      _messages.push(assistantMessage);

      // Handle memory requests from AI
      if (response.memoryRequest) {
        PSMemory.requestLongTerm(
          response.memoryRequest.key,
          response.memoryRequest.value,
          response.memoryRequest.reason
        );
      }

      // Update session name if first message
      if (_messages.filter(m => m.role === 'user').length === 1) {
        updateSessionName(_currentSessionId, content.substring(0, 30) + (content.length > 30 ? '...' : ''));
      }
    } catch (error) {
      console.error('AI response error:', error);
      PSUI.toast('Failed to get response', 'error');
    }

    _isTyping = false;
    render();
  }

  /**
   * Generate AI response (placeholder for actual AI integration)
   */
  async function generateResponse(userMessage) {
    // Get context from memory
    const memories = await PSMemory.getAllForContext();
    
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));

    // Context-aware responses
    const lowerMessage = userMessage.toLowerCase();

    // Check for memory-related queries
    if (lowerMessage.includes('remember') || lowerMessage.includes('save')) {
      const match = userMessage.match(/remember (?:that )?(.+)/i);
      if (match) {
        return {
          text: `I can save "${match[1]}" to your long-term memory. Would you like me to do that?`,
          memoryRequest: {
            key: 'user_note',
            value: match[1],
            reason: 'You asked me to remember this'
          }
        };
      }
    }

    // Check for note queries
    if (lowerMessage.includes('note') || lowerMessage.includes('notes')) {
      return {
        text: "I can help you with your notes. You can ask me to:\n• Search for specific notes\n• Summarize a note\n• Find related notes\n• Expand on an idea\n\nWhat would you like to do?"
      };
    }

    // Check for project queries
    if (lowerMessage.includes('project') || lowerMessage.includes('idea')) {
      return {
        text: "I can help with your projects and ideas. I can:\n• Help brainstorm new ideas\n• Organize your thoughts\n• Create TODO lists\n• Find connections between projects\n\nWhat are you working on?"
      };
    }

    // Reference existing memories
    if (memories.longTerm.length > 0 || memories.working.length > 0) {
      const relevantMemories = [...memories.longTerm, ...memories.working]
        .filter(m => 
          m.key.toLowerCase().includes(lowerMessage.split(' ')[0]) ||
          m.value.toLowerCase().includes(lowerMessage.split(' ')[0])
        );

      if (relevantMemories.length > 0) {
        const memory = relevantMemories[0];
        return {
          text: `Based on what I remember, ${memory.key}: "${memory.value}"\n\nIs there anything specific you'd like to know about this?`
        };
      }
    }

    // Default responses
    const responses = [
      "I understand. How can I help you explore this further?",
      "That's interesting. Would you like me to save this as a note or add it to a project?",
      "I'm here to help. You can ask me about your notes, projects, or memories anytime.",
      "Tell me more about what you're thinking. I can help organize your ideas.",
      "I can help you with that. What specific aspect would you like to focus on?"
    ];

    return {
      text: responses[Math.floor(Math.random() * responses.length)]
    };
  }

  /**
   * Update messages display
   */
  function updateMessages() {
    const container = document.getElementById('chatMessages');
    if (container) {
      container.innerHTML = renderMessages();
      scrollToBottom();
    }
  }

  /**
   * Scroll to bottom of chat
   */
  function scrollToBottom() {
    const container = document.getElementById('chatMessages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  /**
   * Handle keydown in input
   */
  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  /**
   * Auto resize textarea
   */
  function autoResize(element) {
    element.style.height = 'auto';
    element.style.height = Math.min(element.scrollHeight, 120) + 'px';
  }

  /**
   * New session
   */
  function newSession() {
    _currentSessionId = PSCrypto.generateId();
    _messages = [];
    _sessions.unshift({
      id: _currentSessionId,
      name: 'New Chat',
      tags: [],
      lastMessage: Date.now(),
      messageCount: 0
    });
    render();
  }

  /**
   * Switch session
   */
  async function switchSession(sessionId) {
    _currentSessionId = sessionId;
    await loadMessages(sessionId);
    render();
  }

  /**
   * Update session name
   */
  async function updateSessionName(sessionId, name) {
    const session = _sessions.find(s => s.id === sessionId);
    if (session) {
      session.name = name;
    }

    // Update all messages in session
    const messages = await PSStorage.getByIndex(PSStorage.STORES.CHAT, 'sessionId', sessionId);
    for (const msg of messages) {
      msg.sessionName = name;
      await PSStorage.save(PSStorage.STORES.CHAT, msg);
    }
  }

  /**
   * Toggle message pin
   */
  async function togglePin(messageId) {
    const message = _messages.find(m => m.id === messageId);
    if (message) {
      message.pinned = !message.pinned;
      await PSStorage.save(PSStorage.STORES.CHAT, message);
      updateMessages();
    }
  }

  /**
   * Copy message
   */
  function copyMessage(messageId) {
    const message = _messages.find(m => m.id === messageId);
    if (message) {
      navigator.clipboard.writeText(message.content);
      PSUI.toast('Copied to clipboard', 'success');
    }
  }

  /**
   * Attach note to context
   */
  async function attachNote() {
    const notes = await PSStorage.getAll(PSStorage.STORES.NOTES);
    
    if (notes.length === 0) {
      PSUI.toast('No notes available', 'info');
      return;
    }

    const notesList = notes.map(note => `
      <div class="ps-note-item" style="cursor: pointer; padding: 8px;" onclick="PSChat.addNoteContext('${note.id}')">
        <div class="ps-note-title">${escapeHtml(note.title)}</div>
        <div class="ps-note-preview">${escapeHtml((note.content || '').substring(0, 50))}</div>
      </div>
    `).join('');

    PSUI.modal({
      title: 'Add Note to Context',
      content: `<div style="max-height: 300px; overflow-y: auto;">${notesList}</div>`
    });
  }

  /**
   * Add note to chat context
   */
  async function addNoteContext(noteId) {
    const note = await PSStorage.get(PSStorage.STORES.NOTES, noteId);
    if (note) {
      const contextContainer = document.getElementById('chatContext');
      const contextItems = document.getElementById('chatContextItems');
      
      contextContainer.style.display = 'block';
      contextItems.innerHTML += `
        <div class="ps-chat-context-item" data-note-id="${noteId}">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
          ${escapeHtml(note.title)}
        </div>
      `;

      PSMemory.addShortTerm('note_context', note.content, note.title);
    }
  }

  /**
   * Show memory context
   */
  async function showMemory() {
    const memories = await PSMemory.getAllForContext();
    
    const content = `
      <div style="max-height: 300px; overflow-y: auto;">
        <h4 style="margin-bottom: 8px; color: var(--ps-text-secondary);">Working Memory (${memories.working.length})</h4>
        ${memories.working.map(m => `<div style="padding: 4px 0; font-size: 13px;"><strong>${m.key}:</strong> ${m.value}</div>`).join('') || '<p style="color: var(--ps-text-muted);">Empty</p>'}
        
        <h4 style="margin: 16px 0 8px; color: var(--ps-text-secondary);">Long-term Memory (${memories.longTerm.length})</h4>
        ${memories.longTerm.map(m => `<div style="padding: 4px 0; font-size: 13px;"><strong>${m.key}:</strong> ${m.value}</div>`).join('') || '<p style="color: var(--ps-text-muted);">Empty</p>'}
      </div>
    `;

    PSUI.modal({
      title: 'AI Memory Context',
      content
    });
  }

  /**
   * Format message content
   */
  function formatMessage(content) {
    // Basic markdown-like formatting
    return escapeHtml(content)
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/• /g, '• ');
  }

  /**
   * Format time
   */
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Escape HTML
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    load,
    send,
    handleKeydown,
    autoResize,
    newSession,
    switchSession,
    togglePin,
    copyMessage,
    attachNote,
    addNoteContext,
    showMemory
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PSChat;
}
