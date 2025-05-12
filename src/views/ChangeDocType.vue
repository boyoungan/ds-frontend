<template>
  <div class="changedoctype-page">
    <div class="changedoctype-header">
      <div class="nav-buttons">
        <router-link to="/dashboard" class="nav-button nav-home">
          <i class="fas fa-home"></i>
        </router-link>
      </div>
      <h1>📄 문서 타입 변환</h1>
      <p>문서를 업로드하고, 원하는 문자열을 변환하세요.</p>
    </div>

    <div class="changedoctype-content">
      <div class="card-panel">
        <h3>1. 파일 업로드</h3>
        <label class="file-input-label">
          <i class="fas fa-upload"></i> 파일 선택
          <input type="file" @change="onFileChange" accept=".txt,.md" />
        </label>
        <span v-if="file" class="file-name">{{ file.name }}</span>
      </div>

      <div class="card-panel" v-if="preview">
        <h3>2. 문서 미리보기</h3>
        <pre class="preview-box">{{ preview }}</pre>
      </div>

      <div class="card-panel" v-if="preview">
        <h3>3. 변환 규칙 입력</h3>
        <div class="convert-inputs">
          <input v-model="find" placeholder="찾을 문자열 (예: \u202F 또는 직접 입력)" />
          <input v-model="replace" placeholder="바꿀 문자열" />
          <button class="btn btn-primary" @click="convert">변환</button>
          <button class="btn btn-secondary" @click="removeUnicode" style="margin-left:8px;">유니코드삭제</button>
        </div>
      </div>

      <div class="card-panel" v-if="converted">
        <h3>4. 변환 결과</h3>
        <pre class="preview-box">{{ converted }}</pre>
        <button class="btn btn-secondary" @click="download">다운로드</button>
        <button class="btn btn-outline-secondary" @click="copyToClipboard" style="margin-left:8px;">
          <i class="fas fa-copy"></i> 복사
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChangeDocType',
  data() {
    return {
      file: null,
      preview: '',
      find: '',
      replace: '',
      converted: ''
    };
  },
  methods: {
    onFileChange(e) {
      this.file = e.target.files[0];
      this.converted = '';
      const formData = new FormData();
      formData.append('file', this.file);
      fetch('/api/changedoctype/preview', {
        method: 'POST',
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          this.preview = data.content;
        })
        .catch(() => {
          this.preview = '';
          alert('파일 미리보기에 실패했습니다.');
        });
    },
    convert() {
      if (!this.find) {
        alert('찾을 문자열을 입력하세요.');
        return;
      }
      const formData = new FormData();
      formData.append('file', this.file);
      formData.append('find', this.find);
      formData.append('replace', this.replace);
      fetch('/api/changedoctype/convert', {
        method: 'POST',
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          this.converted = data.converted;
        })
        .catch(() => {
          alert('변환에 실패했습니다.');
        });
    },
    download() {
      const blob = new Blob([this.converted], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.file.name.replace(/\.(txt|md)$/i, '_converted.$1');
      a.click();
      URL.revokeObjectURL(url);
    },
    copyToClipboard() {
      if (!this.converted) return;
      navigator.clipboard.writeText(this.converted)
        .then(() => {
          alert('복사되었습니다!');
        })
        .catch(() => {
          alert('복사에 실패했습니다.');
        });
    },
    removeUnicode() {
      if (!this.preview) return;
      // \u202F(NARROW NO-BREAK SPACE) 제거
      const unicodePattern = /\u202F/g;
      if (unicodePattern.test(this.preview)) {
        this.converted = this.preview.replace(unicodePattern, '');
        alert('유니코드 삭제가 완료되었습니다');
      } else {
        alert('유니코드가 발견되지 않았습니다');
      }
    }
  }
};
</script>

<style scoped>
.changedoctype-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 40px 20px;
  font-family: 'Segoe UI', sans-serif;
  color: #333;
  max-width: 900px;
  margin: 0 auto;
}

.changedoctype-header {
  text-align: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.changedoctype-header h1 {
  font-size: 2.2em;
  color: #2c3e50;
  margin-bottom: 10px;
}

.changedoctype-header p {
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

.changedoctype-content {
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

.file-input-label {
  display: inline-flex;
  align-items: center;
  padding: 10px 18px;
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  color: #495057;
  margin-bottom: 10px;
}
.file-input-label i {
  margin-right: 8px;
}
.file-input-label input[type="file"] {
  display: none;
}
.file-name {
  margin-left: 12px;
  font-size: 0.98em;
  color: #6c757d;
}

.convert-inputs {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.convert-inputs input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 15px;
  min-width: 180px;
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
  margin-right: 8px;
}
.btn-primary:hover {
  background: #36976b;
}
.btn-secondary {
  background: #35495e;
  color: #fff;
}
.btn-secondary:hover {
  background: #2c3e50;
}
.btn-outline-secondary {
  background-color: transparent;
  border: 1px solid #6c757d;
  color: #6c757d;
}
.btn-outline-secondary:hover {
  background-color: #6c757d;
  color: white;
}
.preview-box {
  background: #f7f7f7;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 16px;
  font-family: 'Consolas', 'monospace';
  white-space: pre-wrap;
  margin-bottom: 8px;
  max-height: 300px;
  overflow-y: auto;
  font-size: 1em;
}
@media (max-width: 768px) {
  .changedoctype-page {
    padding: 20px 8px;
  }
  .changedoctype-header {
    padding: 14px 4px;
  }
  .card-panel {
    padding: 16px 8px 12px 8px;
  }
  .convert-inputs {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
}
</style> 