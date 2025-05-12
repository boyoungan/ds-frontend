<template>
  <div class="chat-history">
    <div class="history-header">
      <h3>📝 대화 기록</h3>
      <div class="history-controls">
        <button @click="toggleAll" class="toggle-all-button">
          {{ allExpanded ? '전체 접기' : '전체 펼치기' }}
        </button>
      </div>
    </div>
    
    <div v-if="history.length === 0" class="empty-history">
      아직 대화 기록이 없습니다. 질문을 시작해보세요!
    </div>
    
    <div v-else class="history-list">
      <div 
        v-for="(group, date) in groupedHistory" 
        :key="date"
        class="history-group"
      >
        <div class="date-separator">
          <span class="date-text">{{ formatDate(date) }}</span>
        </div>
        
        <div 
          v-for="(item, index) in group" 
          :key="item.id || index"
          class="history-item"
        >
          <div class="history-item-header" @click="toggleItem(item)">
            <span class="expand-icon">{{ item.expanded ? '▼' : '▶' }}</span>
            <span class="history-time">🕒 {{ formatTime(item.timestamp) }}</span>
            <span class="history-preview">{{ truncateText(item.content, 50) }}</span>
            <button 
              @click.stop="$emit('delete-item', item.originalIndex)" 
              class="delete-button"
            >🗑️</button>
          </div>
          
          <div v-show="item.expanded" class="history-item-content">
            <div class="history-question">
              <strong>💬 질문:</strong>
              <p>{{ item.content }}</p>
            </div>
            
            <div class="history-answer" v-if="getAnswer(item)">
              <strong>🤖 답변:</strong>
              <p>{{ getAnswer(item).content }}</p>
            </div>
            
            <div class="history-sources" v-if="getAnswer(item) && getAnswer(item).sources">
              <strong>📚 참조된 청크:</strong>
              <span>{{ getAnswer(item).sources.length }}개의 청크 참조</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatHistory',
  props: {
    history: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      allExpanded: false,
      expandedItems: new Set()
    };
  },
  computed: {
    groupedHistory() {
      const grouped = {};
      
      const userMessages = this.history
        .map((item, index) => ({ ...item, originalIndex: index }))
        .filter(item => item.type === 'user');
      
      userMessages.forEach(item => {
        const date = new Date(item.timestamp).toDateString();
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push({
          ...item,
          expanded: this.expandedItems.has(item.originalIndex)
        });
      });
      
      // 날짜별로 정렬 (latest first)
      const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
      const sortedGrouped = {};
      sortedDates.forEach(date => {
        sortedGrouped[date] = grouped[date];
      });
      
      return sortedGrouped;
    }
  },
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return '오늘';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return '어제';
      } else {
        return date.toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    },
    
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    },
    
    truncateText(text, maxLength) {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    },
    
    getAnswer(question) {
      const index = question.originalIndex;
      // 해당 질문 다음에 있는 assistant 타입의 메시지를 찾음
      if (index < this.history.length - 1) {
        const nextItem = this.history[index + 1];
        if (nextItem && nextItem.type === 'assistant') {
          return nextItem;
        }
      }
      return null;
    },
    
    getOriginalIndex(item) {
      return item.originalIndex;
    },
    
    toggleItem(item) {
      if (this.expandedItems.has(item.originalIndex)) {
        this.expandedItems.delete(item.originalIndex);
      } else {
        this.expandedItems.add(item.originalIndex);
      }
    },
    
    toggleAll() {
      this.allExpanded = !this.allExpanded;
      if (this.allExpanded) {
        this.history.forEach((item, index) => {
          if (item.type === 'user') {
            this.expandedItems.add(index);
          }
        });
      } else {
        this.expandedItems.clear();
      }
    }
  }
};
</script>

<style scoped>
.chat-history {
  padding: 20px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.history-header h3 {
  margin: 0;
  color: #2c3e50;
}

.toggle-all-button {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-all-button:hover {
  background: #2980b9;
}

.empty-history {
  text-align: center;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 10px;
  color: #666;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.history-group {
  margin-bottom: 20px;
}

.date-separator {
  display: flex;
  align-items: center;
  margin: 20px 0 10px;
}

.date-separator::before,
.date-separator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #ddd;
}

.date-text {
  margin: 0 15px;
  color: #666;
  font-weight: bold;
  font-size: 0.9em;
}

.history-item {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 12px;
}

.history-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.history-item:last-child {
  margin-bottom: 0;
}

.history-item-header {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  background: #f8f9fa;
  gap: 12px;
  border-bottom: 1px solid #eee;
}

.expand-icon {
  color: #666;
  width: 20px;
}

.history-time {
  color: #666;
  font-size: 0.9em;
  white-space: nowrap;
}

.history-preview {
  flex: 1;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-button {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 1.1em;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.delete-button:hover {
  opacity: 1;
}

.history-item-content {
  padding: 16px;
  border-top: 1px solid #eee;
}

.history-question,
.history-answer,
.history-sources {
  margin-bottom: 15px;
}

.history-question:last-child,
.history-answer:last-child,
.history-sources:last-child {
  margin-bottom: 0;
}

.history-question strong,
.history-answer strong,
.history-sources strong {
  display: block;
  margin-bottom: 8px;
  color: #34495e;
}

.history-question p,
.history-answer p {
  margin: 0;
  line-height: 1.6;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
}

.history-sources span {
  font-size: 0.9em;
  color: #666;
  background: #f0f0f0;
  padding: 6px 12px;
  border-radius: 4px;
  display: inline-block;
}
</style>
