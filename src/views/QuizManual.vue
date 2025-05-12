<template>
  <div class="quizmanual-page">
    <div class="quizmanual-header">
      <div class="nav-buttons">
        <router-link to="/dashboard" class="nav-button nav-home">
          <i class="fas fa-home"></i>
        </router-link>
      </div>
      <h1>🤔 PDF 매뉴얼 퀴즈 생성기</h1>
      <p>PDF 파일을 업로드하면, 파일 내용으로 퀴즈를 생성합니다.</p>
    </div>
    <div class="quizmanual-content">
      <div
        class="card-panel drop-zone"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        :class="{ 'drag-over': isDragging }"
      >
        <h3>1. PDF 파일 업로드</h3>
        <div class="file-upload-area">
          <label class="file-input-label">
            <i class="fas fa-file-pdf"></i> PDF 파일을 선택하거나 여기에 드롭하세요
            <input type="file" accept="application/pdf" @change="onFileChange" />
          </label>
        </div>
        <div v-if="selectedFile" class="file-actions">
          <span class="file-name">{{ selectedFile.name }}</span>
          <button class="btn btn-primary btn-upload-icon" :disabled="!selectedFile || uploading" @click="handleUpload">
            <i class="fas fa-cloud-upload-alt"></i> {{ uploading ? '업로드 중...' : '업로드' }}
          </button>
        </div>
        <div v-if="uploading" class="info">PDF 업로드 중...</div>
        <div v-if="success && !quizGenerating && !error" class="success">업로드 성공! 퀴즈를 생성 중입니다...</div>
        <div v-if="quizGenerating" class="info">퀴즈 생성 중...</div>
        <div v-if="quizList.length > 0 && !error" class="success">퀴즈 생성 완료!</div>
        <div v-if="error" class="error">{{ error }}</div>
      </div>

      <div class="card-panel" v-if="quizList.length > 0 && !error">
        <h3>2. 생성된 퀴즈</h3>
        <div v-for="(quiz, idx) in quizList" :key="idx" class="quiz-item">
          <div class="quiz-q">{{ idx + 1 }}. {{ quiz.question }}</div>
          <div v-if="quiz.type === 'choice'">
            <div v-for="(opt, oidx) in quiz.options" :key="oidx" class="quiz-option">
              <label>
                <input type="radio" :name="'quiz-' + idx" :value="opt" v-model="userAnswers[idx]" />
                {{ opt }}
              </label>
            </div>
          </div>
          <div v-else-if="quiz.type === 'blank'">
            <input type="text" v-model="userAnswers[idx]" placeholder="정답 입력" class="quiz-input" />
          </div>
          <div v-else-if="quiz.type === 'ox'" class="quiz-options-ox">
            <label><input type="radio" :name="'quiz-' + idx" value="O" v-model="userAnswers[idx]" /> O</label>
            <label><input type="radio" :name="'quiz-' + idx" value="X" v-model="userAnswers[idx]" /> X</label>
          </div>
        </div>
        <button class="btn btn-secondary" @click="checkAnswers" v-if="!showResult">정답 확인</button>
        <div v-if="showResult" class="results-panel">
          <h4>채점 결과</h4>
          <div v-for="(quiz, idx) in quizList" :key="'result-' + idx" class="quiz-result">
            <strong class="quiz-result-q">{{ idx + 1 }}번 문제:</strong>
            <span v-if="userAnswers[idx] === quiz.answer" class="correct">✔ 정답입니다!</span>
            <span v-else class="incorrect">✘ 오답입니다. (정답: {{ quiz.answer }})</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QuizManual',
  data() {
    return {
      selectedFile: null,
      uploading: false,
      error: '',
      success: false,
      quizList: [],
      userAnswers: [],
      showResult: false,
      quizGenerating: false,
      isDragging: false,
    };
  },
  methods: {
    onFileChange(e) {
      const file = e.target.files[0];
      if (file) {
        this.processFile(file);
      }
    },
    processFile(file) {
      if (file && file.type === "application/pdf") {
        this.selectedFile = file;
        this.error = '';
        this.success = false;
        this.quizList = [];
        this.userAnswers = [];
        this.showResult = false;
        this.quizGenerating = false;
      } else {
        this.selectedFile = null;
        this.error = 'PDF 파일만 업로드할 수 있습니다.';
      }
    },
    handleDragOver(e) {
      e.preventDefault();
      this.isDragging = true;
    },
    handleDragLeave(e) {
      e.preventDefault();
      this.isDragging = false;
    },
    handleDrop(e) {
      e.preventDefault();
      this.isDragging = false;
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.processFile(files[0]);
      }
    },
    async handleUpload() {
      if (!this.selectedFile) return;
      this.uploading = true;
      this.error = '';
      this.success = false;
      this.quizList = [];
      this.userAnswers = [];
      this.showResult = false;
      this.quizGenerating = false;
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      try {
        const response = await fetch('/api/upload-pdf', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Try to parse error, default to empty obj
            throw new Error(errorData.error || `업로드 실패: ${response.statusText}`);
        }
        const data = await response.json();
        this.success = true;
        this.quizGenerating = true;
        await this.generateQuiz(data.text);
      } catch (err) {
        this.error = err.message || '알 수 없는 오류';
        this.quizList = []; // Clear quizList on error
      } finally {
        this.uploading = false;
        this.quizGenerating = false; // Ensure this is always reset
      }
    },
    async generateQuiz(text) {
      try {
        const response = await fetch('/api/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `퀴즈 생성 실패: ${response.statusText}`);
        }
        const data = await response.json();
        if (!data.success || !Array.isArray(data.quizList)) { // More robust check
            throw new Error(data.error || '퀴즈 데이터 형식이 올바르지 않습니다.');
        }
        this.quizList = data.quizList;
        this.userAnswers = Array(this.quizList.length).fill('');
        this.error = ''; // Clear previous errors
      } catch (err) {
        this.error = err.message || '퀴즈 생성 중 오류';
        this.quizList = []; // Clear quizList on error
      }
    },
    checkAnswers() {
      this.showResult = true;
    },
  },
};
</script>

<style scoped>
.quizmanual-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 40px 20px;
  font-family: 'Segoe UI', sans-serif;
  color: #333;
  max-width: 900px;
  margin: 0 auto;
}
.quizmanual-header {
  text-align: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}
.quizmanual-header h1 {
  font-size: 2.2em;
  color: #2c3e50;
  margin-bottom: 10px;
}
.quizmanual-header p {
  color: #666;
  font-size: 1.1em;
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
.quizmanual-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.card-panel {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  padding: 28px 24px 20px 24px;
  margin-bottom: 0;
}
.card-panel h3 {
  margin-top: 0;
  margin-bottom: 18px;
  color: #35495e;
  font-size: 1.15em;
}
.drop-zone {
  border: 2px dashed #ccc;
  padding: 20px;
  text-align: center;
  transition: border-color 0.3s, background-color 0.3s;
  margin-bottom: 15px;
}
.drop-zone.drag-over {
  border-color: #42b983;
  background-color: #f0fff0;
}
.file-upload-area {
  margin-bottom: 15px;
}
.file-input-label {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 30px;
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  color: #495057;
  width: 100%;
  box-sizing: border-box;
}
.file-input-label i {
  margin-right: 0;
  margin-bottom: 8px;
  font-size: 1.8em;
}
.file-input-label input[type="file"] {
  display: none;
}
.file-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 15px;
  padding: 0 5px;
}
.file-name {
  margin-left: 0;
  font-size: 0.98em;
  color: #6c757d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 10px;
  flex-grow: 1;
}
.btn {
  padding: 8px 18px;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  font-size: 1em;
}
.btn-primary {
  background: #42b983;
  color: #fff;
}
.btn-primary:hover {
  background: #36976b;
}
.btn-primary.btn-upload-icon {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-secondary {
  background: #35495e;
  color: #fff;
  margin-top: 10px;
}
.btn-secondary:hover {
  background: #2c3e50;
}
.info {
  color: #1976d2;
  background: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 6px;
  padding: 10px 16px;
  margin-top: 12px;
  font-weight: 500;
  text-align: center;
}
.success {
  color: #388e3c;
  background: #e8f5e9;
  border: 1px solid #a5d6a7;
  border-radius: 6px;
  padding: 10px 16px;
  margin-top: 12px;
  font-weight: 500;
  text-align: center;
}
.error {
  color: #d32f2f;
  background: #ffebee;
  border: 1px solid #ef9a9a;
  border-radius: 6px;
  padding: 10px 16px;
  margin-top: 12px;
  font-weight: 500;
  text-align: center;
}
.quiz-item {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}
.quiz-item:last-child {
  border-bottom: none;
  margin-bottom: 10px;
}
.quiz-q {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 1.05em;
}
.quiz-option label,
.quiz-options-ox label {
  display: block;
  margin-bottom: 6px;
  cursor: pointer;
}
.quiz-option input[type="radio"],
.quiz-options-ox input[type="radio"] {
  margin-right: 8px;
}
.quiz-input {
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.95em;
  width: 100%;
  max-width: 300px;
}
.results-panel {
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
}
.results-panel h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #35495e;
}
.quiz-result {
  margin-bottom: 8px;
  font-size: 0.98em;
  padding: 6px 0;
}
.quiz-result-q {
  display: block;
  margin-bottom: 4px;
}
.correct {
  color: #388e3c;
  font-weight: bold;
}
.incorrect {
  color: #d32f2f;
  font-weight: bold;
}

@media (max-width: 768px) {
  .quizmanual-page {
    padding: 20px 8px;
  }
  .quizmanual-header {
    padding: 14px 4px;
  }
  .card-panel {
    padding: 16px 8px 12px 8px;
  }
}
</style>
