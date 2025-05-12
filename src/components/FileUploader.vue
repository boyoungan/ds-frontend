<template>
  <div class="file-uploader">
    <div 
      class="upload-area"
      :class="{ 'dragging': isDragging }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input 
        type="file" 
        ref="fileInput"
        @change="handleFileChange"
        accept=".txt,.pdf,.md,.doc,.docx"
        style="display: none"
      />
      
      <div class="upload-icon">📁</div>
      <div class="upload-text">
        {{ isDragging ? '파일을 놓으세요' : '드래그하거나 클릭하여 업로드' }}
      </div>
      <div class="upload-hint">지원 형식: PDF, TXT, DOC, DOCX, MD</div>
    </div>
    
    <div v-if="currentFile" class="file-info">
      <span class="file-name">{{ currentFile.name }}</span>
      <button @click="clearFile" class="clear-file">✕</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FileUploader',
  data() {
    return {
      isDragging: false,
      currentFile: null
    };
  },
  methods: {
    handleDragOver() {
      this.isDragging = true;
    },
    
    handleDragLeave() {
      this.isDragging = false;
    },
    
    handleDrop(e) {
      this.isDragging = false;
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFile(files[0]);
      }
    },
    
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    
    handleFileChange(e) {
      const files = e.target.files;
      if (files.length > 0) {
        this.handleFile(files[0]);
      }
    },
    
    handleFile(file) {
      const validTypes = ['.txt', '.pdf', '.md', '.doc', '.docx'];
      // 한글 파일명에서 확장자 추출
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!validTypes.includes(extension)) {
        alert('지원하지 않는 파일 형식입니다.');
        return;
      }
      
      // 파일 크기 체크 (50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('파일 크기는 50MB를 초과할 수 없습니다.');
        return;
      }
      
      this.currentFile = file;
      this.$emit('file-uploaded', file);
    },
    
    clearFile() {
      this.currentFile = null;
      this.$refs.fileInput.value = '';
    }
  }
};
</script>

<style scoped>
.file-uploader {
  width: 100%;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #f8f9fa;
}

.upload-area:hover {
  border-color: #3498db;
  background: #f0f8ff;
}

.upload-area.dragging {
  border-color: #3498db;
  background: #e8f4fd;
}

.upload-icon {
  font-size: 2em;
  margin-bottom: 10px;
}

.upload-text {
  margin-bottom: 5px;
  font-weight: bold;
}

.upload-hint {
  font-size: 0.9em;
  color: #666;
}

.file-info {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f1f3f5;
  border-radius: 5px;
}

.file-name {
  font-size: 0.9em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clear-file {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  padding: 0 5px;
  font-size: 1.2em;
}

.clear-file:hover {
  color: #c0392b;
}
</style>
