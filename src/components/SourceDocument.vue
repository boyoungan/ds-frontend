<template>
  <div class="source-document">
    <div class="source-info">
      <h3>📚 소스 문서란?</h3>
      <p>AI가 답변을 생성할 때 참고한 문서의 일부분입니다. 답변의 근거가 되는 원본 내용을 확인할 수 있습니다.</p>
    </div>
    
    <div v-if="!sources || sources.length === 0" class="no-sources">
      <div class="no-sources-icon">📭</div>
      <p>이 답변은 문서 참조 없이 AI의 일반적인 지식으로 생성되었습니다.</p>
    </div>
    
    <div v-else class="sources-list">
      <div 
        v-for="(source, index) in sources" 
        :key="index"
        class="source-item"
      >
        <div class="source-header" @click="toggleSource(index)">
          <span class="source-number">📄 참조 문서 {{ index + 1 }}</span>
          <span class="expand-icon">{{ expandedSources.has(index) ? '▼' : '▶' }}</span>
        </div>
        
        <div v-show="expandedSources.has(index)" class="source-body">
          <div class="source-metadata" v-if="source.metadata">
            <span v-if="source.metadata.page" class="metadata-item">
              📑 페이지: {{ source.metadata.page }}
            </span>
            <span v-if="source.metadata.filename" class="metadata-item">
              📁 파일: {{ source.metadata.filename }}
            </span>
          </div>
          
          <div class="source-content">
            <div v-html="highlightKeywords(source.content)"></div>
          </div>
          
          <div v-if="isContentTruncated(source.content)" class="content-truncated">
            ... (더 많은 내용이 있습니다)
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="sources && sources.length > 0" class="keywords-section">
      <h4>🔍 키워드</h4>
      <div class="keywords-list">
        <span v-for="keyword in extractKeywordsFromQuestion()" :key="keyword" class="keyword-tag">
          {{ keyword }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SourceDocument',
  props: {
    sources: {
      type: Array,
      default: () => []
    },
    question: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      expandedSources: new Set()
    };
  },
  methods: {
    toggleSource(index) {
      if (this.expandedSources.has(index)) {
        this.expandedSources.delete(index);
      } else {
        this.expandedSources.add(index);
      }
      // 강제 리렌더링
      this.$forceUpdate();
    },
    
    highlightKeywords(content) {
      if (!this.question) return content;
      
      const keywords = this.extractKeywordsFromQuestion();
      let highlightedContent = content;
      
      keywords.forEach(keyword => {
        const regex = new RegExp(`(${keyword})`, 'gi');
        highlightedContent = highlightedContent.replace(
          regex, 
          '<mark class="highlight">$1</mark>'
        );
      });
      
      return highlightedContent;
    },
    
    extractKeywordsFromQuestion() {
      if (!this.question) return [];
      
      return this.question
        .toLowerCase()
        .replace(/[^\w\s가-힯]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 1)
        .filter((word, index, self) => self.indexOf(word) === index); // 중복 제거
    },
    
    isContentTruncated(content) {
      return content.length > 1000;
    }
  },
  mounted() {
    // 기본적으로 첫 번째 소스 펼치기
    if (this.sources && this.sources.length > 0) {
      this.expandedSources.add(0);
    }
  }
};
</script>

<style scoped>
.source-document {
  padding: 20px;
}

.source-info {
  background: #f0f9ff;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  border: 1px solid #d0e7ff;
}

.source-info h3 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.source-info p {
  margin: 0;
  color: #555;
  line-height: 1.5;
}

.no-sources {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  color: #666;
}

.no-sources-icon {
  font-size: 3em;
  margin-bottom: 15px;
  opacity: 0.7;
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.source-item {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.source-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #f8f9fa;
  cursor: pointer;
  user-select: none;
}

.source-number {
  font-weight: bold;
  color: #34495e;
}

.expand-icon {
  color: #666;
  font-size: 0.8em;
}

.source-body {
  padding: 15px;
  border-top: 1px solid #e0e0e0;
}

.source-metadata {
  margin-bottom: 15px;
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.metadata-item {
  background: #e8f4fd;
  color: #0066cc;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.85em;
}

.source-content {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  line-height: 1.6;
  font-size: 0.95em;
  overflow-x: auto;
}

.source-content >>> .highlight {
  background-color: #ffeb3b;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 500;
}

.content-truncated {
  margin-top: 10px;
  font-style: italic;
  color: #666;
  font-size: 0.85em;
  text-align: center;
}

.keywords-section {
  margin-top: 25px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.keywords-section h4 {
  margin-bottom: 10px;
  color: #34495e;
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.85em;
  border: 1px solid #bbdefb;
}
</style>
