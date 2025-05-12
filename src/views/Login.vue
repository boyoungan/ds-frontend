<template>
 <div class="login-container">
    <div class="login-background">
      <div class="circle circle1"></div>
      <div class="circle circle2"></div>
    </div>
    <div class="login-box">
      <div class="logo-container">
        <h1>📚 MakeDS</h1>
        <p class="subtitle">일하는 방식을 바꾸는 우리의 선택</p>
      </div>
      <form @submit.prevent="login">
        <div class="input-group">
          <span class="input-icon">🏢</span>
          <select 
            v-model="company_id" 
            class="login-input"
            :class="{ 'error': errors.company_id }"
            @focus="clearError('company_id')"
          >
            <option value="">회사 선택</option>
            <option v-for="company in companies" :key="company.id" :value="company.id">
              {{ company.name }}
            </option>
          </select>
        </div>
        <div class="input-group">
          <span class="input-icon">👤</span>
          <input 
            v-model="employee_number" 
            placeholder="사번" 
            class="login-input"
            :class="{ 'error': errors.employee_number }"
            @focus="clearError('employee_number')"
            autocomplete="username"
          />
        </div>
        <div class="input-group">
          <span class="input-icon">🔒</span>
          <input 
            v-model="password" 
            :type="showPassword ? 'text' : 'password'" 
            placeholder="비밀번호" 
            class="login-input"
            :class="{ 'error': errors.password }"
            @focus="clearError('password')"
            autocomplete="current-password"
          />
          <button 
            type="button" 
            class="toggle-password"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
          <div v-if="remainingAttempts !== null" class="remaining-attempts">
            남은 시도 횟수: {{ remainingAttempts }}회
          </div>
        </div>
        <button 
          type="submit" 
          class="login-button"
          :disabled="isLoading"
        >
          <span v-if="!isLoading">로그인</span>
          <span v-else class="loading">⚪⚪⚪</span>
        </button>
      </form>
      <div class="login-footer">
        <p class="password-policy">
          비밀번호 규칙: 8~16자, 영문/숫자/특수문자 중 2종류 이상
        </p>
        <p class="initial-password-info">
          초기 비밀번호: 사번 + !@#
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'LoginPage',
  data() {
    return {
      employee_number: '',
      company_id: '',
      password: '',
      showPassword: false,
      isLoading: false,
      errorMessage: '',
      remainingAttempts: null,
      errors: {
        employee_number: false,
        company_id: false,
        password: false
      },
      companies: [
        { id: 1, name: 'iM데이터시스템' },
        { id: 2, name: 'iM라이프' },
        { id: 3, name: 'iM캐피탈' }
        // 실제 회사 목록은 API에서 가져와야 함
      ]
    };
  },
  created() {
    // 컴포넌트 생성 시 첫 번째 회사를 기본값으로 설정
    if (this.companies.length > 0) {
      this.company_id = this.companies[0].id;
    }
  },
  methods: {
    async login() {
      if (!this.validateForm()) return;
      
      this.isLoading = true;
      this.errorMessage = '';
      this.remainingAttempts = null;
      
      try {
        const res = await axios.post('/api/auth/login', {
          employee_number: this.employee_number,
          company_id: this.company_id,
          password: this.password
        });

        // 토큰 저장
        localStorage.setItem('token', res.data.token);
        
        // JWT 디코딩하여 사용자 정보 저장
        const tokenData = JSON.parse(atob(res.data.token.split('.')[1]));
        localStorage.setItem('user', JSON.stringify({
          id: tokenData.id,
          employee_number: tokenData.employee_number,
          company_id: tokenData.company_id,
          username: tokenData.username,
          role: tokenData.role
        }));

        this.$router.push('/dashboard');
      } catch (err) {
        if (err.response) {
          this.errorMessage = err.response.data.message;
          if (err.response.data.remainingAttempts !== undefined) {
            this.remainingAttempts = err.response.data.remainingAttempts;
          }
        } else {
          this.errorMessage = '서버 연결에 실패했습니다.';
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    validateForm() {
      let isValid = true;
      
      if (!this.company_id) {
        this.errors.company_id = true;
        isValid = false;
      }
      
      if (!this.employee_number) {
        this.errors.employee_number = true;
        isValid = false;
      }
      
      if (!this.password) {
        this.errors.password = true;
        isValid = false;
      }
      
      if (!isValid) {
        this.errorMessage = '모든 필드를 입력해주세요.';
      }
      
      return isValid;
    },
    
    clearError(field) {
      this.errors[field] = false;
      this.errorMessage = '';
      this.remainingAttempts = null;
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #fff;
  padding: 20px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
}

.circle1 {
  width: 300px;
  height: 300px;
  top: -150px;
  right: -150px;
}

.circle2 {
  width: 200px;
  height: 200px;
  bottom: -100px;
  left: -100px;
}

.login-box {
  background-color: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 1;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-container {
  text-align: center;
  margin-bottom: 30px;
}

.logo-container h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.input-group {
  position: relative;
  margin-bottom: 20px;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #888;
}

.login-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 2px solid #e1e1e1;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.login-input:focus {
  border-color: #3498db;
  outline: none;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.login-input.error {
  border-color: #e74c3c;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #888;
  transition: color 0.3s ease;
}

.toggle-password:hover {
  color: #333;
}

.error-message {
  color: #e74c3c;
  font-size: 14px;
  margin: -10px 0 15px;
  text-align: left;
}

.login-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
}

.login-button:active {
  transform: translateY(0);
}

.login-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading {
  display: inline-block;
  animation: loading 1s infinite;
}

@keyframes loading {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.login-footer {
  margin-top: 20px;
  text-align: center;
}

.forgot-password {
  color: #3498db;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.forgot-password:hover {
  color: #2980b9;
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-box {
    padding: 30px 20px;
  }
  
  .logo-container h1 {
    font-size: 24px;
  }
}

.remaining-attempts {
  font-size: 0.9em;
  margin-top: 5px;
  color: #e74c3c;
}

.password-policy,
.initial-password-info {
  font-size: 0.8em;
  color: #666;
  text-align: center;
  margin: 5px 0;
}

select.login-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  color: #333;
  background-color: white;
  cursor: pointer;
}

select.login-input.error {
  border-color: #e74c3c;
}
</style>

