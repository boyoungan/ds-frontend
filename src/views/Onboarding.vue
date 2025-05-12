// 📁 /ds-frontend/src/views/Onboarding.vue
<template>
  <div class="onboarding-container">
    <section class="hero">
      <h1>경영기획팀 Onboarding</h1>
      <p class="subtitle">우리의 전략은 시스템에서 시작됩니다</p>
    </section>

    <section class="steps">
      <div class="step-card">
        <h3>📌 STEP 1. 시스템 로그인 및 구조 이해</h3>
        <p>업무 시스템의 기본 구조와 사용 목적을 이해하고, 어디서 무엇을 시작해야 하는지 살펴봅니다.</p>
      </div>
      <div class="step-card">
        <h3>📌 STEP 2. 자주 쓰는 기능 익히기</h3>
        <p>업무 기록 작성, 검색, 태그, 자료 첨부 등 가장 많이 사용하는 기능을 빠르게 습득합니다.</p>
      </div>
      <div class="step-card">
        <h3>📌 STEP 3. 업무에 적용하기</h3>
        <p>보고 자동화, OKR 연동, 이전 자료 이관 등 실무 적용 팁을 안내합니다.</p>
      </div>
    </section>

    <section class="resources">
      <h2>🎓 온보딩 자료</h2>
      <ul>
        <li><a href="quizManual">📎 PDF 퀴즈 풀기</a></li>
        <li><a href="#">📎 사용자 매뉴얼 PDF</a></li>
        <li><a href="#">📎 전략기획팀 전용 템플릿</a></li>
        <li><a href="#">📎 사내 교육 영상 보기</a></li>
      </ul>
    </section>

    <section class="cta">
      <p>이제 시스템과 조금 친해지셨나요?</p>
      <router-link to="/dashboard" class="btn btn-primary">업무 기록하러 가기</router-link>
    </section>
  </div>
</template>

<script>
export default {
  name: 'OnboardingPage'
};
</script>

<style scoped>
.onboarding-container {
  padding: 40px 20px;
  font-family: 'Segoe UI', sans-serif;
  color: #333;
}

.hero {
  text-align: center;
  margin-bottom: 40px;
}

.hero h1 {
  font-size: 36px;
  margin-bottom: 10px;
}

.subtitle {
  color: #666;
  font-size: 18px;
}

.steps {
  display: grid;
  gap: 24px;
  margin-bottom: 40px;
}

.step-card {
  border-left: 5px solid #42b983;
  background: #f9f9f9;
  padding: 20px;
  border-radius: 6px;
}

.resources {
  margin-bottom: 40px;
}

.resources ul {
  list-style: none;
  padding: 0;
}

.resources li {
  margin-bottom: 10px;
}

.resources a {
  text-decoration: none;
  color: #35495e;
}

.cta {
  text-align: center;
  margin-top: 40px;
}

.btn-primary {
  background-color: #42b983;
  color: white;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: bold;
  text-decoration: none;
  display: inline-block;
}
</style>
