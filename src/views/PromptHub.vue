<template>
  <div class="prompt-hub">
    <div class="chat-container">
      <!-- 헤더 -->
      <div class="chat-header">
        <div class="nav-buttons">
          <a href="/" class="nav-button nav-home">
            <i class="fas fa-home"></i>
          </a>
        </div>
        <div class="title-wrapper">
          <h1>📚 프롬프트 허브</h1>
          <span class="version-badge">v1.0</span>
        </div>
        <p>AI 프롬프트를 저장, 검색, 공유할 수 있는 내부 서비스입니다.</p>
      </div>

      <div class="prompt-controls">
        <input v-model="search" class="search-bar" placeholder="프롬프트 검색..." @input="filterPrompts" />
        <div class="tag-filter">
          <span v-for="tag in allTags" :key="tag" :class="['tag', {selected: selectedTag === tag}]" @click="selectTag(tag)">
            #{{ tag }}
          </span>
          <span v-if="selectedTag" class="clear-tag" @click="selectTag('')">태그 해제</span>
        </div>
        <button class="add-btn" @click="showForm = true">➕ 프롬프트 등록</button>
      </div>

      <div v-if="isLoading" class="loading">불러오는 중...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else>
        <div v-if="filteredPrompts.length === 0" class="no-prompts">조건에 맞는 프롬프트가 없습니다.</div>
        <div v-else class="prompt-list">
          <div v-for="prompt in filteredPrompts" :key="prompt.filename" class="prompt-item" @click="goToDetail(prompt)">
            <div class="prompt-title">{{ prompt.title }}</div>
            <div class="prompt-meta">
              <span v-if="prompt.tags && prompt.tags.length" class="prompt-tags">
                <span v-for="tag in prompt.tags" :key="tag" class="prompt-tag">#{{ tag }}</span>
              </span>
              <span class="prompt-model">{{ prompt.model }}</span>
              <span class="prompt-version">v{{ prompt.version }}</span>
            </div>
            <div class="prompt-purpose">{{ prompt.purpose }}</div>
          </div>
        </div>
      </div>

      <!-- 등록 폼 모달 -->
      <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
        <div class="modal-content form-modal">
          <div class="modal-header">
            <div class="modal-title">프롬프트 등록</div>
            <button class="modal-close" @click="showForm = false">&times;</button>
          </div>
          <form class="prompt-form" @submit.prevent="submitPrompt" autocomplete="off">
            <div v-if="submitMessage" :class="['form-alert', submitSuccess ? 'success' : 'error']">
              <span v-if="submitSuccess" class="alert-icon">✔️</span>
              <span v-else class="alert-icon">❌</span>
              {{ submitMessage }}
              <button class="alert-close" @click="submitMessage = ''">&times;</button>
            </div>
            <div class="form-row">
              <label for="title">제목 <span class="required">*</span></label>
              <input id="title" v-model="form.title" required maxlength="100" placeholder="프롬프트 제목을 입력하세요" aria-label="제목" :class="{'input-error': !form.title && isSubmitting}" />
              <div class="form-helper">프롬프트의 대표 제목을 입력하세요. (예: 뉴스 요약 프롬프트)</div>
            </div>
            <div class="form-row">
              <label for="purpose">목적</label>
              <input id="purpose" v-model="form.purpose" maxlength="200" placeholder="프롬프트의 목적이나 설명을 입력하세요" aria-label="목적" />
              <div class="form-helper">이 프롬프트의 사용 목적이나 간단한 설명을 적어주세요.</div>
            </div>
            <div class="form-row">
              <label for="tags">태그 <span class="form-helper">(쉼표로 구분)</span></label>
              <input id="tags" v-model="form.tags" placeholder="예: 요약, 번역, 분석" aria-label="태그" />
              <div class="form-helper">관련 키워드를 쉼표로 구분해 입력하세요. (예: 요약, 번역, 분석)</div>
            </div>
            <div class="form-row">
              <label for="model">모델</label>
              <input id="model" v-model="form.model" placeholder="예: GPT-4" aria-label="모델" />
              <div class="form-helper">이 프롬프트에 적합한 AI 모델명을 입력하세요.</div>
            </div>
            <div class="form-row">
              <label for="version">버전</label>
              <input id="version" v-model="form.version" placeholder="예: 1.0" aria-label="버전" />
              <div class="form-helper">프롬프트 버전을 입력하세요. (선택)</div>
            </div>
            <div class="form-row">
              <label for="content">프롬프트 내용 <span class="required">*</span></label>
              <textarea id="content" v-model="form.content" required rows="6" maxlength="2000" placeholder="실제 프롬프트 텍스트를 입력하세요" aria-label="프롬프트 내용" :class="{'input-error': !form.content && isSubmitting}"></textarea>
              <div class="form-helper">
                실제 AI에게 입력할 프롬프트 텍스트를 입력하세요.<br />
                <span class="char-count">({{ form.content.length }}/2000자)</span>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" :disabled="isSubmitting">
                <span v-if="isSubmitting" class="btn-spinner"></span>
                {{ isSubmitting ? '저장 중...' : '저장' }}
              </button>
              <button type="button" @click="resetForm" :disabled="isSubmitting">초기화</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'PromptHub',
  data() {
    return {
      prompts: [],
      filteredPrompts: [],
      isLoading: false,
      error: '',
      search: '',
      allTags: [],
      selectedTag: '',
      showForm: false,
      // 추가 폼 관련
      form: {
        title: '',
        purpose: '',
        tags: '',
        model: '',
        version: '',
        content: '',
      },
      isSubmitting: false,
      submitMessage: '',
      submitSuccess: false,
    };
  },
  created() {
    this.fetchPrompts();
  },
  methods: {
    async fetchPrompts() {
      this.isLoading = true;
      this.error = '';
      try {
        const res = await axios.get('/api/jekyll/promptLibrary/posts');
        this.prompts = res.data.posts || [];
        this.updateTags();
        this.filterPrompts();
      } catch (e) {
        this.error = '프롬프트 목록을 불러오지 못했습니다.';
      } finally {
        this.isLoading = false;
      }
    },
    filterPrompts() {
      let list = this.prompts;
      if (this.search.trim()) {
        const q = this.search.trim().toLowerCase();
        list = list.filter(p =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.purpose && p.purpose.toLowerCase().includes(q)) ||
          (p.tags && p.tags.some(tag => tag.toLowerCase().includes(q)))
        );
      }
      if (this.selectedTag) {
        list = list.filter(p => p.tags && p.tags.includes(this.selectedTag));
      }
      this.filteredPrompts = list;
    },
    updateTags() {
      const tagSet = new Set();
      this.prompts.forEach(p => {
        (p.tags || []).forEach(tag => tag && tag.trim() && tagSet.add(tag));
      });
      this.allTags = Array.from(tagSet).sort();
    },
    selectTag(tag) {
      this.selectedTag = tag;
      this.filterPrompts();
    },
    goToDetail(prompt) {
      this.$router.push(`/prompt/${prompt.filename}`);
    },
    async submitPrompt() {
      if (!this.form.title.trim() || !this.form.content.trim()) {
        this.submitMessage = '제목과 프롬프트 내용은 필수입니다.';
        this.submitSuccess = false;
        return;
      }
      this.isSubmitting = true;
      this.submitMessage = '';
      this.submitSuccess = false;
      try {
        // 파일명: YYYY-MM-DD-title.md
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const sanitizedTitle = this.form.title.replace(/[^a-zA-Z0-9가-힣]/g, '_');
        const filename = `${yyyy}-${mm}-${dd}-${sanitizedTitle}.md`;
        // front-matter 생성
        const frontMatter =
`---\ntitle: "${this.form.title}"\npurpose: "${this.form.purpose}"\ntags: [${this.form.tags.split(',').map(t=>`'${t.trim()}'`).filter(Boolean).join(', ')}]\nmodel: "${this.form.model}"\nversion: "${this.form.version}"\ndate: ${yyyy}-${mm}-${dd}\n---\n`;
        const content = frontMatter + '\n' + this.form.content;
        await axios.post('/api/jekyll/promptLibrary/posts', {
          filename,
          content,
          isDraft: false
        });
        this.submitMessage = '프롬프트가 성공적으로 저장되었습니다!';
        this.submitSuccess = true;
        this.resetForm();
        this.search = '';
        this.selectedTag = '';
        await this.fetchPrompts();
        await this.filterPrompts();
        setTimeout(() => {
          this.showForm = false;
          this.submitMessage = '';
          this.submitSuccess = false;
        }, 1500);
      } catch (e) {
        this.submitMessage = '저장에 실패했습니다.';
        this.submitSuccess = false;
      } finally {
        this.isSubmitting = false;
      }
    },
    resetForm() {
      this.form = {
        title: '',
        purpose: '',
        tags: '',
        model: '',
        version: '',
        content: '',
      };
      this.submitMessage = '';
      this.submitSuccess = false;
    }
  }
};
</script>

<style scoped>
.prompt-hub {
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

.prompt-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  margin-top: 10px;
}
.search-bar {
  flex: 1 1 220px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1.5px solid #e3eaf3;
  font-size: 1em;
  background: #fff;
  transition: border 0.2s;
}
.search-bar:focus {
  border-color: #3498db;
  outline: none;
}
.tag-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tag {
  background: #e3eaf3;
  color: #3498db;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.98em;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.tag.selected {
  background: #3498db;
  color: #fff;
}
.clear-tag {
  color: #e74c3c;
  font-size: 0.98em;
  cursor: pointer;
  margin-left: 4px;
  text-decoration: underline;
}
.add-btn {
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 22px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  box-shadow: 0 1px 3px rgba(52,152,219,0.08);
}
.add-btn:hover {
  background: #2980b9;
}
.loading, .error, .no-prompts {
  text-align: center;
  color: #888;
  font-size: 1.1em;
  padding: 40px 0;
}
.error {
  color: #e74c3c;
}
.no-prompts {
  color: #b0b8c1;
}
.prompt-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.prompt-item {
  background: #f9fafb;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  padding: 18px 22px;
  transition: box-shadow 0.2s;
  border: 1px solid #f0f0f0;
  cursor: pointer;
}
.prompt-item:hover {
  box-shadow: 0 4px 12px rgba(52,152,219,0.08);
  border-color: #e3eaf3;
}
.prompt-title {
  font-size: 1.2em;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 6px;
}
.prompt-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.prompt-tags {
  display: flex;
  gap: 6px;
}
.prompt-tag {
  background: #e3eaf3;
  color: #3498db;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.9em;
}
.prompt-model {
  background: #f5f5f5;
  color: #555;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.9em;
}
.prompt-version {
  color: #aaa;
  font-size: 0.9em;
}
.prompt-purpose {
  color: #555;
  font-size: 1em;
  margin-top: 2px;
}
/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content.form-modal {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(52,152,219,0.15);
  padding: 36px 32px 28px 32px;
  min-width: 340px;
  max-width: 600px;
  width: 100%;
  position: relative;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.modal-title {
  font-size: 1.3em;
  font-weight: bold;
  color: #2c3e50;
}
.modal-close {
  background: none;
  border: none;
  font-size: 2em;
  color: #aaa;
  cursor: pointer;
  line-height: 1;
  padding: 0 8px;
  transition: color 0.2s;
}
.modal-close:hover {
  color: #e74c3c;
}
.form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 18px;
}
.form-row label {
  font-weight: 600;
  margin-bottom: 6px;
  color: #34495e;
  display: flex;
  align-items: center;
  gap: 4px;
}
.form-row .form-helper {
  color: #8ca0b3;
  font-size: 0.93em;
  margin-top: 3px;
  margin-bottom: 2px;
}
.form-row input,
.form-row textarea {
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  padding: 11px 13px;
  font-size: 1em;
  background: #fff;
  transition: border 0.2s, box-shadow 0.2s;
}
.form-row input:focus,
.form-row textarea:focus {
  border-color: #3498db;
  outline: none;
  box-shadow: 0 0 0 2px #e3eaf3;
}
.form-row input.input-error,
.form-row textarea.input-error {
  border-color: #e74c3c;
  background: #fff6f6;
}
.form-row textarea {
  resize: vertical;
  min-height: 90px;
}
.char-count {
  color: #b0b8c1;
  font-size: 0.92em;
  margin-left: 4px;
}
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 10px;
  justify-content: flex-end;
}
.form-actions button {
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  background: #3498db;
  color: #fff;
  transition: background 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 3px rgba(52,152,219,0.08);
  display: flex;
  align-items: center;
  gap: 6px;
}
.form-actions button[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
.form-actions button[type="button"] {
  background: #f5f5f5;
  color: #555;
  border: 1px solid #ddd;
}
.form-actions button[type="button"]:hover {
  background: #e8e8e8;
  border-color: #ccc;
}
.form-actions button[type="submit"]:hover:not([disabled]) {
  background: #2980b9;
}
.btn-spinner {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
  display: inline-block;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.required {
  color: #e74c3c;
  font-size: 1em;
  margin-left: 2px;
}
.form-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 8px;
  font-size: 1.08em;
  margin-bottom: 18px;
  margin-top: -10px;
  position: relative;
  justify-content: center;
}
.form-alert.success {
  background: #eafaf1;
  color: #27ae60;
  border: 1.5px solid #b7e6c7;
}
.form-alert.error {
  background: #fff6f6;
  color: #e74c3c;
  border: 1.5px solid #f5b7b7;
}
.alert-icon {
  font-size: 1.3em;
  margin-right: 2px;
}
.alert-close {
  background: none;
  border: none;
  font-size: 1.2em;
  color: #aaa;
  cursor: pointer;
  margin-left: 8px;
  position: absolute;
  right: 10px;
  top: 7px;
  line-height: 1;
  transition: color 0.2s;
}
.alert-close:hover {
  color: #e74c3c;
}
@media (max-width: 768px) {
  .prompt-controls {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  .form-modal {
    padding: 18px 6vw 18px 6vw;
    min-width: 0;
  }
  .chat-header h1 {
    font-size: 1.5em;
  }
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
</style>