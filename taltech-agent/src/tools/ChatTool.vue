<template>
  <div class="chat-tool" @keydown.stop>

    <!-- Header -->
    <div class="chat-header">
      <div class="chat-header-left">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>Chat</span>
        <span class="model-badge">{{ model }}</span>
      </div>
      <div class="chat-header-right">
        <button class="icon-btn" title="Settings" @click="showSettings = !showSettings">
          ⚙
        </button>
        <button class="icon-btn danger" title="Clear" @click="clearMessages">
          🗑
        </button>
      </div>
    </div>

    <!-- Settings -->
    <transition name="slide">
      <div v-if="showSettings && !readOnly" class="settings-panel">
        <label class="settings-label">Model</label>
        <select v-model="model" class="settings-input">
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>

        <label class="settings-label">System Prompt</label>
        <textarea
          v-model="systemPrompt"
          class="settings-textarea"
          rows="3"
          placeholder="You are a helpful assistant."
        />

        <label class="context-toggle">
          <input type="checkbox" v-model="useContext" />
          Include blocks above as context
        </label>
      </div>
    </transition>

    <!-- Messages -->
    <div class="chat-messages" ref="messagesEl">
      <div v-if="!messages.length" class="chat-empty">
        Start a conversation...
      </div>

      <div
        v-for="(msg, i) in messages"
        :key="i"
        :class="['message', `message--${msg.role}`]"
      >
        <div class="message-role">{{ msg.role === 'user' ? 'You' : 'Assistant' }}</div>
        <div class="message-content" v-html="renderMarkdown(msg.content)" />
        <div class="message-time">{{ msg.time }}</div>
      </div>

      <div v-if="isLoading" class="message message--assistant">
        <div class="message-role">Assistant</div>
        <div class="typing">
          <span /><span /><span />
        </div>
      </div>
    </div>

    <!-- Context badge -->
    <div v-if="useContext && contextBlocks.length" class="context-badge">
      <span>📄 {{ contextBlocks.length }} context block{{ contextBlocks.length !== 1 ? 's' : '' }}</span>
      <button class="context-peek" @click="showContext = !showContext">
        {{ showContext ? 'hide' : 'peek' }}
      </button>
    </div>
    <transition name="slide">
      <pre v-if="showContext" class="context-body">{{ contextBlocks.join('\n\n---\n\n') }}</pre>
    </transition>

    <!-- Input -->
    <div v-if="!readOnly" class="chat-input-row">
      <textarea
        ref="inputEl"
        v-model="inputText"
        class="chat-input"
        placeholder="Message... (Enter to send, Shift+Enter for newline)"
        rows="1"
        :disabled="isLoading"
        @keydown.enter.exact.prevent="send"
        @input="autoResize"
      />
      <button
        class="send-btn"
        :disabled="!inputText.trim() || isLoading"
        @click="send"
      >
        ➤
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, watch, nextTick, onMounted } from 'vue';

const props = defineProps({
  initialData: { type: Object, required: true },
  readOnly:    { type: Boolean, default: false },
  endpoint:    { type: String, required: true },
  getContext:  { type: Function, default: null },
  onSave:      { type: Function, required: true },
});

// ── State ──────────────────────────────────────────────────────────────────
const messages     = reactive(props.initialData.messages || []);
const model        = ref(props.initialData.model);
const systemPrompt = ref(props.initialData.systemPrompt);
const useContext   = ref(true);
const inputText    = ref('');
const isLoading    = ref(false);
const showSettings = ref(false);
const showContext  = ref(false);
const contextBlocks = ref([]);

const messagesEl = ref(null);
const inputEl    = ref(null);

// ── Context ────────────────────────────────────────────────────────────────
async function collectContext() {
  if (!useContext.value) return [];

  if (props.getContext) {
    return await props.getContext();
  }

  // Default: scrape text from all .ce-block elements above this chat block
  const allBlocks  = [...document.querySelectorAll('.ce-block')];
  const wrapper    = document.querySelector('.chat-tool-wrapper');
  const result     = [];

  for (const block of allBlocks) {
    if (block.contains(wrapper)) break;
    const text = block.innerText?.trim();
    if (text) result.push(text);
  }

  return result;
}

async function refreshContext() {
  contextBlocks.value = await collectContext();
}

// ── Build payload ──────────────────────────────────────────────────────────
function buildPayload() {
  return {
    model:        model.value,
    systemPrompt: systemPrompt.value,
    context:      contextBlocks.value,   // array of strings
    messages:     messages.map(({ role, content }) => ({ role, content })),
  };
}

// ── Send ───────────────────────────────────────────────────────────────────
async function send() {
  const content = inputText.value.trim();
  if (!content || isLoading.value) return;

  messages.push({ role: 'user', content, time: now() });
  inputText.value = '';
  isLoading.value = true;
  resetHeight();
  await nextTick();
  scrollBottom();

  await refreshContext();

  try {
    const payload = buildPayload();

    const res = await fetch(props.endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    // Accept { reply } | { message } | { content } | plain string
    const reply =
      json.reply   ??
      json.message ??
      json.content ??
      (typeof json === 'string' ? json : JSON.stringify(json));

    messages.push({ role: 'assistant', content: reply, time: now() });
  } catch (err) {
    messages.push({ role: 'assistant', content: `⚠️ ${err.message}`, time: now() });
  } finally {
    isLoading.value = false;
    save();
    await nextTick();
    scrollBottom();
  }
}

// ── Persist ────────────────────────────────────────────────────────────────
function save() {
  props.onSave({
    messages:     [...messages],
    model:        model.value,
    systemPrompt: systemPrompt.value,
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────
function clearMessages() {
  messages.splice(0);
  save();
}

function scrollBottom() {
  if (messagesEl.value)
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
}

function autoResize(e) {
  const el = e.target;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

function resetHeight() {
  if (inputEl.value) inputEl.value.style.height = 'auto';
}

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderMarkdown(text) {
  return text
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

// ── Watchers ───────────────────────────────────────────────────────────────
watch([model, systemPrompt], save);
watch(useContext, (v) => { if (v) refreshContext(); });

onMounted(() => {
  refreshContext();
  scrollBottom();
});
</script>

<style scoped>
.chat-tool {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid var(--color-node-border, #e8e3d8);
  border-radius: 12px;
  overflow: hidden;
  font-family: var(--font-sans, sans-serif);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin: 1rem 0;
  max-width: 100%;
}

/* Header */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #fcfaf7;
  border-bottom: 1px solid var(--color-node-border, #e8e3d8);
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text-primary);
}

.model-badge {
  font-size: 0.7rem;
  background: #f0ede8;
  padding: 2px 8px;
  border-radius: 10px;
  color: var(--color-text-muted);
  font-weight: 500;
  text-transform: uppercase;
}

.chat-header-right {
  display: flex;
  gap: 4px;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  color: var(--color-text-muted);
  transition: all 0.2s;
  font-size: 1.1rem;
  line-height: 1;
}

.icon-btn:hover {
  background: #f0ede8;
  color: var(--color-text-primary);
}

.icon-btn.danger:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* Settings */
.settings-panel {
  padding: 16px;
  background: #fcfaf7;
  border-bottom: 1px solid var(--color-node-border, #e8e3d8);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.settings-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.settings-input, .settings-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-node-border, #e8e3d8);
  border-radius: 6px;
  font-size: 0.9rem;
  background: #ffffff;
  outline: none;
}

.settings-input:focus, .settings-textarea:focus {
  border-color: var(--color-accent, #6366f1);
}

.context-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--color-text-primary);
  cursor: pointer;
  margin-top: 4px;
}

/* Messages */
.chat-messages {
  flex: 1;
  max-height: 500px;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #ffffff;
}

.chat-empty {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  padding: 40px 0;
  font-style: italic;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 90%;
}

.message--user {
  align-self: flex-end;
}

.message--assistant {
  align-self: flex-start;
}

.message-role {
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--color-text-muted);
}

.message--user .message-role {
  text-align: right;
}

.message-content {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.95rem;
  line-height: 1.5;
  word-break: break-word;
}

.message--user .message-content {
  background: var(--color-accent, #6366f1);
  color: #ffffff;
  border-bottom-right-radius: 2px;
}

.message--assistant .message-content {
  background: #f0f0f0;
  color: var(--color-text-primary);
  border-bottom-left-radius: 2px;
}

.message-content :deep(pre) {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
  font-family: 'Fira Code', monospace;
  font-size: 0.85rem;
}

.message-content :deep(code) {
  background: rgba(0,0,0,0.05);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}

.message--user .message-content :deep(code) {
  background: rgba(255,255,255,0.2);
}

.message-time {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.message--user .message-time {
  text-align: right;
}

/* Typing indicator */
.typing {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing span {
  width: 6px;
  height: 6px;
  background: #bbb;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing span:nth-child(1) { animation-delay: -0.32s; }
.typing span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
}

/* Context Badge */
.context-badge {
  padding: 8px 16px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #64748b;
}

.context-peek {
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 2px 6px;
  cursor: pointer;
  color: #64748b;
}

.context-peek:hover {
  background: #f1f5f9;
}

.context-body {
  background: #f1f5f9;
  padding: 12px;
  font-size: 0.75rem;
  max-height: 150px;
  overflow-y: auto;
  margin: 0;
  border-top: 1px solid #e2e8f0;
  white-space: pre-wrap;
  color: #475569;
}

/* Input area */
.chat-input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 16px;
  background: #ffffff;
  border-top: 1px solid var(--color-node-border, #e8e3d8);
}

.chat-input {
  flex: 1;
  border: 1px solid var(--color-node-border, #e8e3d8);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.95rem;
  outline: none;
  resize: none;
  max-height: 160px;
  background: #ffffff;
  transition: border-color 0.2s;
  line-height: 1.4;
}

.chat-input:focus {
  border-color: var(--color-accent, #6366f1);
}

.send-btn {
  background: var(--color-accent, #6366f1);
  color: #ffffff;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-bottom: 2px;
}

.send-btn:hover:not(:disabled) {
  background: #4f46e5;
  transform: scale(1.05);
}

.send-btn:disabled {
  background: #e2e8f0;
  cursor: not-allowed;
}

/* Transitions */
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.slide-enter-from, .slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
