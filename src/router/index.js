import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import Onboarding from '../views/Onboarding.vue';
import Calcdate from '../views/Calcdate.vue';
import DocChat from '../views/DocChat.vue';
import ManageGoods from '../views/ManageGoods.vue';
import ChangeDocType from '../views/ChangeDocType.vue';
import QuizManual from '../views/QuizManual.vue';
import PromptHub from '../views/PromptHub.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/onboarding', component: Onboarding, meta: { requiresAuth: true } },
  { path: '/calcdate', component: Calcdate, meta: { requiresAuth: true } },
  { path: '/docchat', component: DocChat, meta: { requiresAuth: true } },
  { path: '/managegoods', component: ManageGoods, meta: { requiresAuth: true } },
  { path: '/changdoctype', component: ChangeDocType, meta: { requiresAuth: true } },
  { path: '/quizmanual', component: QuizManual, meta: { requiresAuth: true } },
  { path: '/prompthub', component: PromptHub, meta: { requiresAuth: true } },
{ path: '/prompt/:filename', component: () => import('../views/PromptDetail.vue'), meta: { requiresAuth: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// JWT 토큰 유효성 검사 함수
const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    // JWT 토큰의 payload 부분 디코딩
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // 만료 시간 확인
    const expirationTime = payload.exp * 1000; // JWT의 exp는 초 단위
    const currentTime = Date.now();
    
    return currentTime < expirationTime;
  } catch (e) {
    console.error('토큰 검증 오류:', e);
    return false;
  }
};

// Add route guard to ignore /uploads paths
router.beforeEach((to, from, next) => {
  // Ignore /uploads paths completely
  if (to.path.startsWith('/uploads')) {
    window.location.href = to.fullPath;
    return;
  }

  const token = localStorage.getItem('token');
  const isValid = isTokenValid(token);
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token || !isValid) {
      // 토큰이 없거나 유효하지 않은 경우 localStorage 정리
      if (!isValid && token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      next('/login');
    } else {
      next();
    }
  } else {
    if (token && isValid && to.path === '/login') {
      next('/dashboard');
    } else {
      next();
    }
  }
});

export default router;
