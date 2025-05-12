<template>
  <div class="home-container">
    <div class="user-info">
      <p><strong>{{ username }}</strong>님, 환영합니다!</p>
      <button class="btn btn-outline" @click="logout">로그아웃</button>
    </div>

    <section class="hero">
      <div class="hero-content">
        <h1>Make.ds</h1>
        <p class="subtitle">We Make DS different<br>일하는 방식을 바꾸는 우리의 선택</p>
      </div>
    </section>

    <section class="features">
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">📄</div>
          <h3>업무기록 입력</h3>
          <p>수기 업무 전산 입력</p>
        </div>
        <div class="feature-card">
          <a href="/quizmanual" target="_self" style="text-decoration: none; color: inherit;">
            <div class="feature-icon">🤔</div>
            <h3>AI문서 퀴즈</h3>
            <p>문서로 퀴즈 만들기</p>
          </a>
        </div>
        <div class="feature-card">
          <a href="/changdoctype" target="_self" style="text-decoration: none; color: inherit;">
          <div class="feature-icon">📄</div>
            <h3>문서 타입 변환</h3>
            <p>문서의 타입과 내용을 변환</p>
          </a>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔗</div>
          <h3>조직 업적 평가</h3>
          <p>조직 업적 평가 서류</p>
        </div>
        <div class="feature-card">
          <a href="/prompthub" target="_self" style="text-decoration: none; color: inherit;">
            <div class="feature-icon">🧑‍💻</div>
            <h3>프롬프트 허브</h3>
            <p>AI Prompt 저장소</p>
          </a>
        </div>
        <div class="feature-card">
          <a href="/calcdate" target="_self" style="text-decoration: none; color: inherit;">
            <div class="feature-icon">🗓️</div>
            <h3>연차계산기</h3>
            <p>연차 계산 방식</p>
          </a>
        </div>
        <div class="feature-card">
          <a href="/docchat" target="_self" style="text-decoration: none; color: inherit;">
            <div class="feature-icon">🤖</div>
            <h3>DocuChat</h3>
            <p>문서와 대화하는 AI</p>
          </a>
        </div>
        <div class="feature-card">
          <a href="/managegoods" target="_self" style="text-decoration: none; color: inherit;">
            <div class="feature-icon">💸</div>
            <h3>소모품관리</h3>
            <p>소모품 비품 구매 관리</p>
          </a>
        </div>
      </div>
    </section>

    <section class="cta">
      <h2>Smart Work. Strong Team</h2>
      <p>업무의 생산성과 효율성을 높이되, 기본은 제대로 지킬 수 있도록</p>
      <a href="/onboarding" target="_self" style="text-decoration: none; color: inherit;">
        <div class="onboarding-box">
          <h3>Team Onboarding Program</h3>
          <p>신규 구성원이 빠르게 팀에 적응할 수 있도록, 사용 가이드와 예시 데이터를 포함한 온보딩 절차를 제공합니다.</p>
          <button class="btn btn-secondary">온보딩 시작하기</button>
        </div>
      </a>
      <div class="onboarding-box">
        <h3>Team Sharing account</h3>
        <p>팀에서 공통으로 사용하는 계정/시스템 정보를 공유합니다</p>
        <button class="btn btn-secondary">공유계정 확인하기</button>
      </div>
    </section>
  </div>
</template>
<script>
export default {
  name: 'DashboardPage',
  data() {
    return {
      username: ''
    };
  },
  mounted() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.$router.push('/login');
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // 토큰 만료 확인
        const expirationTime = payload.exp * 1000; // JWT의 exp는 초 단위
        const currentTime = Date.now();
        
        if (currentTime >= expirationTime) {
          console.log('토큰이 만료되었습니다.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.$router.push('/login');
          return;
        }
        
        this.username = payload.username || '사용자';
      } catch (e) {
        console.error('토큰 파싱 오류:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.$router.push('/login');
      }
    }
  },
  methods: {
    logout() {
      localStorage.removeItem('token');
      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
.home-container {
  padding: 40px 20px;
  font-family: 'Segoe UI', sans-serif;
  color: #333;
  max-width: 1200px;
  margin: 0 auto;
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background-color: #f3f3f3;
  padding: 12px 20px;
  border-radius: 8px;
}

.hero {
  text-align: center;
  margin-bottom: 60px;
}

.hero h1 {
  font-size: 48px;
  margin-bottom: 16px;
}

.subtitle {
  font-size: 18px;
  color: #666;
  margin-bottom: 24px;
}

.hero-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #42b983;
  color: white;
}

.btn-primary:hover {
  background-color: #3aa876;
  transform: translateY(-2px);
}

.btn-secondary {
  background-color: #35495e;
  color: white;
}

.btn-secondary:hover {
  background-color: #2c3e50;
  transform: translateY(-2px);
}

.btn-outline {
  background-color: transparent;
  border: 2px solid #42b983;
  color: #42b983;
}

.btn-outline:hover {
  background-color: rgba(66, 185, 131, 0.1);
  transform: translateY(-2px);
}

.features {
  margin-bottom: 60px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-top: 20px;
}

.feature-card {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.feature-card h3 {
  margin-bottom: 12px;
  font-size: 18px;
}

.feature-card p {
  color: #666;
  font-size: 14px;
}

.cta {
  text-align: center;
  margin-top: 40px;
  background-color: #f9f9f9;
  padding: 40px 20px;
  border-radius: 12px;
}

.cta h2 {
  color: #42b983;
  margin-bottom: 16px;
  font-size: 28px;
}

.cta p {
  color: #666;
  margin-bottom: 32px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.onboarding-box {
  margin-top: 40px;
  padding: 24px;
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 10px;
  text-align: left;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.onboarding-box:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.onboarding-box h3 {
  margin-bottom: 12px;
  color: #35495e;
}

.onboarding-box p {
  margin-bottom: 16px;
  color: #555;
  line-height: 1.6;
}

.onboarding-box .btn {
  margin-top: 8px;
}

@media (max-width: 768px) {
  .home-container {
    padding: 20px 15px;
  }
  
  .hero h1 {
    font-size: 36px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .onboarding-box {
    margin-top: 24px;
  }
}
</style>
