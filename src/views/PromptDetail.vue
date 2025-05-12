<template>
  <div class="prompt-detail-view">
    <div class="detail-container" v-if="isLoading">
      <div class="loading">불러오는 중...</div>
    </div>
    <div class="detail-container" v-else-if="error">
      <div class="error">{{ error }}</div>
    </div>
    <div class="detail-container" v-else-if="prompt">
      <div class="detail-header">
        <h1>{{ prompt.title }}</h1>
        <div class="meta">
          <span v-if="prompt.tags && prompt.tags.length" class="tags">
            <span v-for="tag in prompt.tags" :key="tag" class="tag">#{{ tag }}</span>
          </span>
          <span class="model">{{ prompt.model }}</span>
          <span class="version">v{{ prompt.version }}</span>
        </div>
      </div>
      <div class="purpose"><b>목적:</b> {{ prompt.purpose }}</div>
      <div class="content-block">
        <b>프롬프트 내용:</b>
        <pre class="prompt-text">{{ prompt.content }}</pre>
      </div>
      <div class="actions">
        <button @click="$router.back()">← 목록으로</button>
        <!-- (추후) 수정/삭제 버튼 추가 가능 -->
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'PromptDetail',
  data() {
    return {
      prompt: null,
      isLoading: true,
      error: '',
    };
  },
  async created() {
    const filename = this.$route.params.filename;
    if (!filename) {
      this.error = '잘못된 접근입니다.';
      this.isLoading = false;
      return;
    }
    try {
      const res = await axios.get('/api/jekyll/promptLibrary/posts');
      const found = (res.data.posts || []).find(p => p.filename === filename);
      if (found) {
        this.prompt = found;
      } else {
        this.error = '프롬프트를 찾을 수 없습니다.';
      }
    } catch (e) {
      this.error = '프롬프트 정보를 불러오지 못했습니다.';
    } finally {
      this.isLoading = false;
    }
  }
};
</script>

<style scoped>
.prompt-detail-view {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 40px 0;
}
.detail-container {
  max-width: 700px;
  margin: 0 auto;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  padding: 36px 32px 28px 32px;
}
.detail-header {
  margin-bottom: 18px;
}
.detail-header h1 {
  font-size: 2em;
  color: #2c3e50;
  margin-bottom: 8px;
}
.meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.tags {
  display: flex;
  gap: 6px;
}
.tag {
  background: #e3eaf3;
  color: #3498db;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.95em;
}
.model {
  background: #f5f5f5;
  color: #555;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.95em;
}
.version {
  color: #aaa;
  font-size: 0.95em;
}
.purpose {
  color: #555;
  font-size: 1.08em;
  margin-bottom: 14px;
}
.content-block {
  margin-bottom: 18px;
}
.prompt-text {
  background: #f9fafb;
  border-radius: 8px;
  padding: 14px;
  font-size: 1.05em;
  color: #222;
  white-space: pre-wrap;
  word-break: break-all;
  margin-top: 6px;
}
.actions {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}
.actions button {
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  background: #3498db;
  color: #fff;
  transition: background 0.2s;
}
.actions button:hover {
  background: #2980b9;
}
.loading, .error {
  text-align: center;
  color: #888;
  font-size: 1.1em;
  padding: 60px 0;
}
.error {
  color: #e74c3c;
}
</style>
