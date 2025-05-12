<template>
  <div class="doc-chat">
    <div class="chat-container">
      <!-- 헤더 -->
      <div class="chat-header">
        <div class="nav-buttons">
          <a href="/" class="nav-button nav-home">
            <i class="fas fa-home"></i>
          </a>
        </div>
        <div class="title-wrapper">
          <h1>🤖 DocuChat</h1>
          <span class="version-badge">v1.0</span>
        </div>
        <p>문서와 대화하는 AI 어시스턴트</p>
      </div>

      <div class="chat-layout">
        <!-- 사이드바 -->
        <div class="sidebar">
          <div class="settings-panel">

            <!-- 파일 업로드 -->
            <div class="setting-item">
              <h3>📤 파일 업로드</h3>
              <FileUploader @file-uploaded="onFileUploaded" />
            </div>

            <!-- 답변 스타일 설정 -->
            <div class="setting-item">
              <h3>🎨 답변 스타일</h3>
              <select v-model="answerStyle">
                <option value="전문적">전문적</option>
                <option value="친근한">친근한</option>
                <option value="간결한">간결한</option>
              </select>
            </div>

            <!-- 온도 설정 -->
            <div class="setting-item">
              <h3>🎚️ 답변 창의성</h3>
              <div class="temperature-control">
                <input 
                  type="range" 
                  v-model="temperature" 
                  min="0" 
                  max="1" 
                  step="0.1"
                />
                <span class="temperature-value">{{ temperature }}</span>
              </div>
            </div>

            <!-- 최근 대화 -->
            <div class="setting-item" v-if="chatHistory.length > 0">
              <h3>💬 최근 대화 (최근 5개)</h3>
              <div class="recent-chats">
                <div 
                  v-for="(chatPair, index) in recentChats" 
                  :key="index"
                  class="recent-chat-item"
                  @click="scrollToChat(chatPair.user)"
                >
                  <div class="chat-timestamp">{{ formatRecentTime(chatPair.user.timestamp) }}</div>
                  <div class="chat-question">
                    <span class="chat-badge user-badge">Q</span> {{ chatPair.user.content }}
                  </div>
                  <div v-if="chatPair.assistant" class="chat-answer">
                    <span class="chat-badge assistant-badge">A</span> {{ chatPair.assistant.content.substring(0, 80) + (chatPair.assistant.content.length > 80 ? '...' : '') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 메인 채팅 영역 -->
        <div class="main-content">
          <div class="tabs">
            <button 
              :class="{ active: activeTab === 'chat' }"
              @click="activeTab = 'chat'"
            >
              💬 채팅
            </button>
            <button 
              :class="{ active: activeTab === 'history' }"
              @click="activeTab = 'history'"
            >
              📜 대화 기록
            </button>
            <button 
              :class="{ active: activeTab === 'source' }"
              @click="activeTab = 'source'"
            >
              📑 소스 문서
            </button>
          </div>

          <div class="tab-content">
            <!-- 채팅 탭 -->
            <div v-if="activeTab === 'chat'" class="chat-tab">
              <div class="chat-messages" ref="chatMessages">
                <ChatMessage 
                  v-for="(message, index) in currentChatMessages" 
                  :key="index"
                  :message="message"
                />
                <div v-if="isLoading" class="typing-indicator">
                  <div class="typing-dot"></div>
                  <div class="typing-dot"></div>
                  <div class="typing-dot"></div>
                </div>
              </div>
              
              <div class="chat-input-container">
                <div class="input-wrapper">
                  <textarea
                    v-model="currentMessage"
                    @keyup.ctrl.enter="sendMessage"
                    ref="messageInput"
                    placeholder="문서에 대해 궁금한 점을 물어보세요..."
                    rows="3"
                  ></textarea>
                  <div class="input-actions">
                    <span class="char-count">{{ currentMessage.length }}/1000</span>
                    <div class="chat-buttons">
                      <button @click="clearInput" class="clear-button" :disabled="isSending">
                        지우기
                      </button>
                      <button @click="sendMessage" class="send-button" :disabled="isSending || !currentMessage.trim()">
                        {{ isSending ? '전송 중...' : '전송' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 대화 기록 탭 -->
            <div v-if="activeTab === 'history'" class="history-tab">
              <div class="history-header">
                <h3>대화 기록 (최근 100개)</h3>
                <div class="history-actions">
                  <button @click="exportChatHistory" class="icon-btn" title="내보내기">
                    <span>💾</span>
                  </button>
                  <button @click="triggerImport" class="icon-btn" title="가져오기">
                    <span>📂</span>
                  </button>
                  <input type="file" ref="importInput" @change="importChatHistory" accept=".json" style="display: none;">
                  <button @click="clearChatHistoryFromDB" class="icon-btn danger" title="전체 삭제">
                    <span>🗑️</span>
                  </button>
                </div>
              </div>
              <ChatHistory 
                :history="chatHistory"
                @delete-item="deleteHistoryItem"
              />
            </div>

            <!-- 소스 문서 탭 -->
            <div v-if="activeTab === 'source'" class="source-tab">
              <SourceDocument 
                :sources="currentSources"
                :question="lastQuestion"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import FileUploader from '@/components/FileUploader.vue';
import ChatMessage from '@/components/ChatMessage.vue';
import ChatHistory from '@/components/ChatHistory.vue';
import SourceDocument from '@/components/SourceDocument.vue';

export default {
  name: 'DocChat',
  components: {
    FileUploader,
    ChatMessage,
    ChatHistory,
    SourceDocument
  },
  data() {
    return {
      currentMessage: '',
      documentId: null,
      fileName: null,
      chatHistory: [],
      currentChatMessages: [], // 현재 채팅 세션의 메시지
      currentSources: null,
      lastQuestion: '',
      answerStyle: '전문적',
      temperature: 0.7, //초가값 세팅
      activeTab: 'chat',
      isLoading: false,
      db: null,
      isSending: false // 메시지 전송 중인지 확인하는 플래그 추가
    };
  },
  beforeRouteEnter(to, from, next) {
    next(vm => {
      // 라우팅으로 진입할 때마다 현재 채팅 세션만 초기화
      vm.currentChatMessages = [];
      vm.chatHistory = []; // 대화 기록도 초기화하여 모두 숨김
      vm.currentSources = null;
      vm.lastQuestion = '';
      vm.currentMessage = '';
      vm.activeTab = 'chat';
      
      // 채팅 입력창으로 포커스
      vm.$nextTick(() => {
        if (vm.$refs.messageInput) {
          vm.$refs.messageInput.focus();
        }
      });
    });
  },

  async created() {
    // IndexedDB 초기화 및 대화 기록 불러오기
    await this.initIndexedDB();
    // 대화 기록을 불러오지만 표시하지 않음 (DB에만 저장)
    await this.loadChatHistoryFromDB();
  },
  
  mounted() {
    // 페이지 처음 로드시 현재 채팅 세션 초기화 (대화 기록은 유지)
    this.currentChatMessages = [];
    this.chatHistory = []; // 대화 기록도 초기화하여 모두 숨김
    this.currentSources = null;
    this.lastQuestion = '';
    this.activeTab = 'chat';  // 채팅탭을 기본으로 선택
    this.currentMessage = ''; // 입력 필드도 초기화
    
    // 채팅 입력창으로 포커스
    this.$nextTick(() => {
      if (this.$refs.messageInput) {
        this.$refs.messageInput.focus();
      }
    });
  },
  watch: {
    chatHistory: {
      handler() {
        // 대화 기록이 변경될 때마다 자동 저장
        this.saveChatHistoryToDB();
      },
      deep: true
    }
  },
  computed: {
    recentChats() {
      const chatPairs = [];
      
      // 사용자 메시지와 관련 응답을 쌍으로 만들기
      for (let i = 0; i < this.chatHistory.length; i++) {
        if (this.chatHistory[i].type === 'user') {
          const userMessage = this.chatHistory[i];
          const assistantMessage = (i + 1 < this.chatHistory.length && 
                                  this.chatHistory[i + 1].type === 'assistant') ? 
                                  this.chatHistory[i + 1] : null;
          
          chatPairs.push({
            user: userMessage,
            assistant: assistantMessage
          });
        }
      }
      
      // 최근 5개 쌍만 반환 (총 10개 메시지)
      return chatPairs.slice(-5).reverse();
    }
  },
  methods: {
    async onFileUploaded(file) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        this.isLoading = true;
        const response = await axios.post('/api/docChat/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json, text/plain, */*'
          },
          // 한글 파일명 처리를 위한 설정
          transformRequest: [function (data) {
            return data;
          }]
        });
        
        if (response.data.success) {
          this.documentId = response.data.documentId;
          this.fileName = response.data.filename;
          
          // 새 파일 업로드 시 현재 채팅 세션 초기화 (대화 기록은 유지)
          this.currentChatMessages = [];
          this.currentSources = null;
          this.lastQuestion = '';
          
          console.log(`${this.fileName} 파일이 성공적으로 업로드되었습니다.`);
        }
      } catch (error) {
        console.error('파일 업로드 오류:', error);
        const errorMessage = error.response?.data?.error || '파일 업로드에 실패했습니다.';
        alert(errorMessage);
      } finally {
        this.isLoading = false;
      }
    },

    async sendMessage() {
      // 이미 전송 중이거나 메시지가 비어있으면 실행하지 않음
      if (this.isSending || !this.currentMessage.trim()) return;
      
      if (!this.documentId) {
        alert('먼저 문서를 업로드해주세요.');
        return;
      }

      // 전송 중 플래그 설정
      this.isSending = true;

      const question = this.currentMessage;
      this.currentMessage = '';
      
      // 사용자 메시지 추가
      const userMessage = {
        id: Date.now(), // 고유 ID 추가
        type: 'user',
        content: question,
        timestamp: new Date()
      };
      this.chatHistory.push(userMessage);
      this.currentChatMessages.push(userMessage);
      
      // 100개 제한 체크
      if (this.chatHistory.length > 100) {
        this.chatHistory = this.chatHistory.slice(-100);
      }
      
      try {
        this.isLoading = true;
        const response = await axios.post('/api/docChat/chat', {
          question,
          documentId: this.documentId,
          answerStyle: this.answerStyle,
          temperature: this.temperature
        }, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json; charset=utf-8'
          }
        });
        
        // AI 응답 추가
        const assistantMessage = {
          id: Date.now() + 1, // 고유 ID 추가
          type: 'assistant',
          content: response.data.answer,
          sources: response.data.sources,
          timestamp: new Date()
        };
        this.chatHistory.push(assistantMessage);
        this.currentChatMessages.push(assistantMessage);
        
        // 100개 제한 체크
        if (this.chatHistory.length > 100) {
          this.chatHistory = this.chatHistory.slice(-100);
        }
        
        this.currentSources = response.data.sources;
        this.lastQuestion = question;
        
        // 스크롤을 맨 아래로
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      } catch (error) {
        alert('답변 생성에 실패했습니다.');
      } finally {
        this.isLoading = false;
        this.isSending = false; // 전송 완료 후 플래그 해제
      }
    },

    clearInput() {
      this.currentMessage = '';
    },

    deleteHistoryItem(index) {
      // 현재 삭제하려는 항목의 ID
      const itemToDelete = this.chatHistory[index];
      
      // 질문을 삭제할 때 관련 답변도 함께 삭제
      if (itemToDelete.type === 'user' && index < this.chatHistory.length - 1) {
        const nextItem = this.chatHistory[index + 1];
        if (nextItem && nextItem.type === 'assistant') {
          // 답변을 먼저 삭제
          this.chatHistory.splice(index + 1, 1);
          this.currentChatMessages = this.currentChatMessages.filter(msg => msg.id !== nextItem.id);
        }
      }
      
      // 질문 삭제
      this.chatHistory.splice(index, 1);
      this.currentChatMessages = this.currentChatMessages.filter(msg => msg.id !== itemToDelete.id);
    },

    scrollToBottom() {
      const chatMessages = this.$refs.chatMessages;
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    },
    
    formatRecentTime(timestamp) {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) { // 1분 미만
        return '방금 전';
      } else if (diff < 3600000) { // 1시간 미만
        return `${Math.floor(diff / 60000)}분 전`;
      } else if (diff < 86400000) { // 24시간 미만
        return `${Math.floor(diff / 3600000)}시간 전`;
      } else {
        return date.toLocaleDateString('ko-KR');
      }
    },
    
    scrollToChat(chat) {
      // 채팅 탭으로 이동
      this.activeTab = 'chat';
      // 해당 채팅으로 스크롤
      this.$nextTick(() => {
        const chatElement = document.querySelector(`[data-chat-id="${chat.timestamp}"]`);
        if (chatElement) {
          chatElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    },

    // IndexedDB 초기화
    async initIndexedDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('DocChatDB', 1);
        
        request.onerror = (event) => {
          console.error('IndexedDB 오류:', event);
          reject(event);
        };
        
        request.onsuccess = (event) => {
          this.db = event.target.result;
          resolve(this.db);
        };
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // 대화 기록 저장소 생성
          if (!db.objectStoreNames.contains('chatHistory')) {
            const objectStore = db.createObjectStore('chatHistory', { keyPath: 'id', autoIncrement: true });
            objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
          
          // 문서 정보 저장소 생성
          if (!db.objectStoreNames.contains('documentInfo')) {
            db.createObjectStore('documentInfo', { keyPath: 'id' });
          }
        };
      });
    },

    // 대화 기록을 IndexedDB에 저장 (최근 100개 제한)
    async saveChatHistoryToDB() {
      if (!this.db) return;
      
      try {
        // 최근 100개만 유지
        const limitedHistory = this.chatHistory.slice(-100);
        
        const transaction = this.db.transaction(['chatHistory', 'documentInfo'], 'readwrite');
        const chatStore = transaction.objectStore('chatHistory');
        const docStore = transaction.objectStore('documentInfo');
        
        // 기존 데이터 삭제
        await new Promise((resolve, reject) => {
          const clearRequest = chatStore.clear();
          clearRequest.onsuccess = () => resolve();
          clearRequest.onerror = () => reject(clearRequest.error);
        });
        
        // 새 대화 기록 저장 (최근 100개)
        for (const chat of limitedHistory) {
          await new Promise((resolve, reject) => {
            const request = chatStore.add({
              ...chat,
              timestamp: chat.timestamp.toISOString()
            });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
        
        // 문서 정보 저장
        await new Promise((resolve, reject) => {
          const request = docStore.put({
            id: 'current',
            documentId: this.documentId,
            fileName: this.fileName
          });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        
        console.log('대화 기록이 성공적으로 저장되었습니다. (최근 100개)');
      } catch (error) {
        console.error('대화 기록 저장 실패:', error);
      }
    },

    // IndexedDB에서 대화 기록 불러오기
    async loadChatHistoryFromDB() {
      if (!this.db) return;
      
      try {
        const transaction = this.db.transaction(['chatHistory', 'documentInfo'], 'readonly');
        const chatStore = transaction.objectStore('chatHistory');
        const docStore = transaction.objectStore('documentInfo');
        
        // 대화 기록 불러오기
        const chatHistory = await new Promise((resolve, reject) => {
          const request = chatStore.getAll();
          request.onsuccess = () => {
            const chats = request.result.map((chat, index) => ({
              ...chat,
              timestamp: new Date(chat.timestamp),
              // 기존 데이터에 ID가 없는 경우 추가
              id: chat.id || `legacy-${index}`
            }));
            resolve(chats);
          };
          request.onerror = () => reject(request.error);
        });
        
        // DB에 저장은 하되 UI에는 표시하지 않음
        this.chatHistory = chatHistory;
        
        // 문서 정보 불러오기
        const docInfo = await new Promise((resolve, reject) => {
          const request = docStore.get('current');
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        if (docInfo) {
          this.documentId = docInfo.documentId;
          this.fileName = docInfo.fileName;
        }
        
        console.log('대화 기록을 DB에서 불러왔지만 화면에 표시하지 않습니다.');
      } catch (error) {
        console.error('대화 기록 불러오기 실패:', error);
      }
    },

    // 대화 기록 삭제
    async clearChatHistoryFromDB() {
      if (!this.db) return;
      
      try {
        const transaction = this.db.transaction(['chatHistory', 'documentInfo'], 'readwrite');
        const chatStore = transaction.objectStore('chatHistory');
        const docStore = transaction.objectStore('documentInfo');
        
        await new Promise((resolve, reject) => {
          const request = chatStore.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        
        await new Promise((resolve, reject) => {
          const request = docStore.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        
        this.chatHistory = [];
        this.currentChatMessages = []; // 현재 채팅 세션도 초기화
        this.documentId = null;
        this.fileName = null;
        
        console.log('대화 기록이 성공적으로 삭제되었습니다.');
      } catch (error) {
        console.error('대화 기록 삭제 실패:', error);
      }
    },

    // 대화 기록을 JSON 파일로 내보내기
    exportChatHistory() {
      const exportData = {
        chatHistory: this.chatHistory,
        documentId: this.documentId,
        fileName: this.fileName,
        exportDate: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileName = `docuchat_history_${new Date().toISOString().slice(0,10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
    },

    // 파일 선택 창 열기
    triggerImport() {
      this.$refs.importInput.click();
    },

    // JSON 파일에서 대화 기록 가져오기
    async importChatHistory(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const importData = JSON.parse(e.target.result);
            
            // 데이터 유효성 검사
            if (!importData.chatHistory || !Array.isArray(importData.chatHistory)) {
              throw new Error('유효하지 않은 대화 기록 파일입니다.');
            }
            
            // 날짜 문자열을 Date 객체로 변환하고 ID 확인
            this.chatHistory = importData.chatHistory.map((chat, index) => ({
              ...chat,
              timestamp: new Date(chat.timestamp),
              id: chat.id || `imported-${index}` // ID가 없는 경우 추가
            }));
            
            if (importData.documentId) this.documentId = importData.documentId;
            if (importData.fileName) this.fileName = importData.fileName;
            
            // IndexedDB에 저장
            await this.saveChatHistoryToDB();
            
            alert('대화 기록을 성공적으로 가져왔습니다.');
          } catch (error) {
            console.error('대화 기록 파싱 오류:', error);
            alert('대화 기록 가져오기에 실패했습니다.');
          }
        };
        reader.readAsText(file);
      } catch (error) {
        console.error('파일 읽기 오류:', error);
        alert('파일을 읽는 동안 오류가 발생했습니다.');
      }
      
      // 파일 선택 초기화
      event.target.value = '';
    }
  }
};
</script>

<style scoped>
.doc-chat {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.chat-container {
  max-width: 1400px;
  margin: 0 auto;
}

.chat-header {
  position: relative;
  text-align: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chat-header h1 {
  font-size: 2.5em;
  color: #2c3e50;
  margin-bottom: 10px;
}

.title-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.version-badge {
    background: #4CAF50;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8em;
    font-weight: 600;
}

.chat-header p {
  color: #666;
  font-size: 1.1em;
}

.chat-layout {
  display: flex;
  gap: 20px;
}

.sidebar {
  width: 300px;
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.setting-item {
  margin-bottom: 25px;
}

.setting-item h3 {
  margin-bottom: 10px;
  color: #34495e;
  font-size: 1.1em;
}

.api-key-input input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.temperature-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.temperature-control input[type="range"] {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #ddd;
  border-radius: 3px;
  outline: none;
}

.temperature-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #3498db;
  border-radius: 50%;
  cursor: pointer;
}

.temperature-control input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #3498db;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.temperature-value {
  min-width: 30px;
  text-align: center;
  font-weight: bold;
  color: #3498db;
}

.main-content {
  flex: 1;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  padding: 0 20px;
}

.tabs button {
  padding: 15px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1em;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.tabs button.active {
  color: #3498db;
  border-bottom-color: #3498db;
}

.tab-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.chat-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 400px;
}

.chat-input-container {
  padding: 16px 20px;
  background-color: white;
  border-top: 1px solid #f3f4f6;
}

.input-wrapper {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

.chat-input-container textarea {
  width: 100%;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  resize: none;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: #1f2937;
  background-color: #f9fafb;
  transition: all 0.2s ease;
  min-height: 56px;
  height: auto;
}

.chat-input-container textarea:focus {
  outline: none;
  border-color: #3498db;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.chat-input-container textarea::placeholder {
  color: #9ca3af;
  font-weight: 400;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.char-count {
  font-size: 12px;
  color: #9ca3af;
  margin-left: 4px;
}

.chat-buttons {
  display: flex;
  gap: 8px;
}

.chat-buttons button {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
  min-width: 80px;
}

.send-button {
  background: #3498db;
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.2);
}

.send-button:hover {
  background: #2980b9;
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
  transform: translateY(-1px);
}

.send-button:active {
  transform: translateY(0);
}

.clear-button {
  background: #f5f5f5;
  color: #555;
  border: 1px solid #ddd;
  cursor: pointer;
}

.clear-button:hover {
  background: #e8e8e8;
  border-color: #ccc;
}

.send-button:disabled, .clear-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.send-button:disabled:hover, .clear-button:disabled:hover {
  background: #3498db;  /* 원래 색상 유지 */
  transform: none;
  box-shadow: none;
}

.clear-button:disabled:hover {
  background: #f5f5f5;  /* 원래 색상 유지 */
  border-color: #ddd;
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 16px;
  margin: 10px 0;
  width: fit-content;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: #bbb;
  border-radius: 50%;
  margin: 0 2px;
  animation: typingAnimation 1.5s infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingAnimation {
  0% {
    transform: translateY(0);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-10px);
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
}

.recent-chats {
  max-height: 350px; /* 더 많은 대화를 보여주기 위해 높이 증가 */
  overflow-y: auto;
}

.recent-chat-item {
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 5px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: background 0.3s;
}

.recent-chat-item:hover {
  background: #f8f9fa;
}

.chat-timestamp {
  font-size: 0.8em;
  color: #888;
  margin-bottom: 5px;
}

.chat-question, .chat-answer {
  font-size: 0.9em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 5px;
}

.chat-answer {
  color: #444;
  font-style: italic;
}

.chat-badge {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  text-align: center;
  line-height: 20px;
  font-size: 12px;
  font-weight: bold;
  margin-right: 5px;
}

.user-badge {
  background-color: #3498db;
  color: white;
}

.assistant-badge {
  background-color: #2ecc71;
  color: white;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.history-header h3 {
  margin: 0;
  font-size: 1.2em;
  color: #34495e;
}

.history-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 1.1em;
}

.icon-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.icon-btn.danger {
  border-color: #ffebee;
  color: #d32f2f;
}

.icon-btn.danger:hover {
  background: #ffebee;
  border-color: #ef9a9a;
}

.nav-buttons {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 12px;
}

.nav-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.nav-home {
  opacity: 0.5;
  background-color: #f8f9fa;
  color: #495057;
  border: 1px solid #ddd;
}

.nav-home:hover {
  background-color: #e9ecef;
}

@media (max-width: 768px) {
  .nav-buttons {
    position: static;
    justify-content: center;
    margin-top: 20px;
  }
}
</style>
