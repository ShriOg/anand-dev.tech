let chatHistory = [];

async function initAIModule(container) {
  container.innerHTML = `
    <div class="module-header">
      <h2>AI Assistant</h2>
      <button class="btn-secondary" onclick="clearChat()">Clear Chat</button>
    </div>
    <div id="chatContainer" class="chat-container">
      <div id="chatMessages" class="chat-messages"></div>
    </div>
    <div class="chat-input-container">
      <textarea id="chatInput" placeholder="Type your message..." class="chat-input" onkeydown="handleChatKeydown(event)"></textarea>
      <button class="btn-primary" onclick="sendMessage()">Send</button>
    </div>
  `;

  renderChatHistory();
}

function renderChatHistory() {
  const messagesContainer = document.getElementById('chatMessages');

  if (chatHistory.length === 0) {
    messagesContainer.innerHTML = '<p class="empty-state">Start a conversation with the AI assistant!</p>';
    return;
  }

  messagesContainer.innerHTML = chatHistory.map(msg => `
    <div class="chat-message ${msg.role}">
      <div class="message-content">${escapeHtml(msg.content)}</div>
      <span class="message-time">${formatTime(msg.timestamp)}</span>
    </div>
  `).join('');

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();

  if (!message) return;

  chatHistory.push({
    role: 'user',
    content: message,
    timestamp: new Date(),
  });

  input.value = '';
  renderChatHistory();

  const messagesContainer = document.getElementById('chatMessages');
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'chat-message assistant loading';
  loadingDiv.innerHTML = '<div class="message-content">Thinking...</div>';
  messagesContainer.appendChild(loadingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    const response = await api.post('/api/ai', { message });

    chatHistory.push({
      role: 'assistant',
      content: response.reply,
      timestamp: new Date(),
    });

    renderChatHistory();
  } catch (error) {
    loadingDiv.remove();

    if (error.message.includes('rate limit')) {
      chatHistory.push({
        role: 'assistant',
        content: 'Rate limit reached. Please try again later.',
        timestamp: new Date(),
      });
    } else {
      chatHistory.push({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      });
    }

    renderChatHistory();
  }
}

function handleChatKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

function clearChat() {
  if (confirm('Are you sure you want to clear the chat history?')) {
    chatHistory = [];
    renderChatHistory();
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
