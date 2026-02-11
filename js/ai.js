var AI = (function () {
  'use strict';

  var history = [];

  function init() {
    var input = document.getElementById('chatInput');
    if (input) {
      input.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 100) + 'px';
      });
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  async function send() {
    var input = document.getElementById('chatInput');
    var btn = document.getElementById('chatSend');
    var container = document.getElementById('chatMessages');
    if (!input || !container) return;

    var message = input.value.trim();
    if (!message) return;

    appendMessage('user', message);
    input.value = '';
    input.style.height = 'auto';
    btn.disabled = true;

    history.push({ role: 'user', content: message });

    var typingEl = showTyping(container);

    try {
      var data = await API.post('/ai', { message: message, history: history });
      var reply = data.reply || data.message || data.response || (typeof data === 'string' ? data : 'No response');
      history.push({ role: 'assistant', content: reply });
      removeTyping(typingEl);
      appendMessage('assistant', reply);
    } catch (err) {
      removeTyping(typingEl);
      appendMessage('assistant', 'Sorry, something went wrong: ' + err.message);
    }

    btn.disabled = false;
    input.focus();
  }

  function appendMessage(role, text) {
    var container = document.getElementById('chatMessages');
    if (!container) return;

    var avatar = role === 'user' ? '👤' : '🤖';
    var div = document.createElement('div');
    div.className = 'chat-message ' + role;
    div.innerHTML =
      '<div class="chat-avatar">' + avatar + '</div>' +
      '<div class="chat-bubble">' + formatText(text) + '</div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function showTyping(container) {
    var div = document.createElement('div');
    div.className = 'chat-message assistant';
    div.innerHTML =
      '<div class="chat-avatar">🤖</div>' +
      '<div class="chat-bubble"><div class="chat-typing"><span></span><span></span><span></span></div></div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function removeTyping(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function formatText(text) {
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    text = text.replace(/```([\s\S]*?)```/g, '<pre style="background:rgba(255,255,255,.05);padding:10px;border-radius:8px;margin:8px 0;overflow-x:auto;font-family:var(--font-mono);font-size:12px">$1</pre>');
    text = text.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,.06);padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:12px">$1</code>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\n/g, '<br>');
    return text;
  }

  return {
    init: init,
    send: send,
    handleKey: handleKey
  };
})();
