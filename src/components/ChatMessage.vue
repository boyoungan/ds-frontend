<template>
  <div class="chat-message" :class="message.type" :data-chat-id="message.timestamp">
    <div class="message-container">
      <div class="message-avatar">
        <span class="avatar-icon">{{ message.type === 'user' ? '👤' : '🤖' }}</span>
      </div>
      
      <div class="message-content-wrapper">
        <div class="message-header">
          <span class="message-role">{{ message.type === 'user' ? '사용자' : '김도큐' }}</span>
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
        </div>
        
        <div class="message-bubble">
          <div class="message-content" v-html="renderMarkdown(message.content)">
          </div>
         
          
          <div v-if="message.sources && message.sources.length > 0" class="message-sources">
            <div class="sources-title">📚 참조된 문서 부분</div>
            <div 
              v-for="(source, index) in message.sources.slice(0, 2)" 
              :key="index"
              class="source-item"
            >
              <div class="source-text">{{ source.content.substring(0, 100) }}...</div>
              <div class="source-metadata" v-if="source.metadata">
                <span v-if="source.metadata.page">📄 페이지: {{ source.metadata.page }}</span>
              </div>
            </div>
            <div v-if="message.sources.length > 2" class="sources-more">
              ...그 외 {{ message.sources.length - 2 }}개의 참조
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked';

export default {
  name: 'ChatMessage',
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  methods: {
    renderMarkdown(content) {
      if (!content) return '';
      return marked(content, {
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false
      });
    },
    formatTime(timestamp) {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      const now = new Date();
      // const diff = now - date;
      
      // 오늘인 경우
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      }
      
      // 어제인 경우
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return '어제 ' + date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      }
      
      // 그 외
      return date.toLocaleDateString('ko-KR', { 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
};
</script>

<style scoped>
.chat-message {
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-container {
  display: flex;
  gap: 12px;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chat-message.user .message-avatar {
  background: #e8f4fd;
}

.chat-message.assistant .message-avatar {
  background: #f0f0f0;
}

.avatar-icon {
  font-size: 1.5em;
}

.message-content-wrapper {
  flex: 1;
  max-width: 80%;
}

.chat-message.user .message-content-wrapper {
  margin-left: auto;
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  gap: 8px;
}

.chat-message.user .message-header {
  justify-content: flex-end;
}

.message-role {
  font-weight: bold;
  font-size: 0.9em;
}

.message-time {
  font-size: 0.8em;
  color: #888;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 16px;
  position: relative;
}

.chat-message.user .message-bubble {
  background: #3498db;
  color: white;
  border-bottom-right-radius: 4px;
}

.chat-message.assistant .message-bubble {
  background: #f8f9fa;
  border-bottom-left-radius: 4px;
}

.message-content {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
}

.message-content >>> h1,
.message-content >>> h2,
.message-content >>> h3 {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.message-content >>> p {
  margin: 0 0 10px 0;
}

.message-content >>> ul,
.message-content >>> ol {
  margin: 0 0 10px 20px;
  padding: 0;
}

.message-content >>> li {
  margin-bottom: 5px;
}

.message-content >>> code {
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
}

.chat-message.user .message-content >>> code {
  background: rgba(255, 255, 255, 0.2);
}

.message-content >>> pre {
  background: rgba(0, 0, 0, 0.05);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 10px 0;
}

.chat-message.user .message-content >>> pre {
  background: rgba(255, 255, 255, 0.1);
}

.message-content >>> blockquote {
  border-left: 3px solid #ddd;
  margin: 10px 0;
  padding-left: 15px;
  color: #666;
}

.chat-message.user .message-content >>> blockquote {
  border-left-color: rgba(255, 255, 255, 0.5);
  color: rgba(255, 255, 255, 0.9);
}

.message-content >>> table {
  border-collapse: collapse;
  margin: 10px 0;
  width: 100%;
}

.message-content >>> th,
.message-content >>> td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.message-content >>> th {
  background: rgba(0, 0, 0, 0.05);
}

.chat-message.user .message-content >>> th,
.chat-message.user .message-content >>> td {
  border-color: rgba(255, 255, 255, 0.2);
}

.chat-message.user .message-content >>> th {
  background: rgba(255, 255, 255, 0.1);
}

.message-sources {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0,0,0,0.1);
}

.chat-message.user .message-sources {
  border-top-color: rgba(255,255,255,0.2);
}

.sources-title {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 0.9em;
}

.source-item {
  background: rgba(0,0,0,0.05);
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 0.85em;
}

.chat-message.user .source-item {
  background: rgba(255,255,255,0.1);
}

.source-text {
  margin-bottom: 4px;
}

.source-metadata {
  font-size: 0.8em;
  opacity: 0.8;
}

.sources-more {
  font-size: 0.85em;
  font-style: italic;
  opacity: 0.8;
}
</style>
