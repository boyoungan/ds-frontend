<template>
  <div class="calcdate-page">
    <div class="header-area">
      <div class="nav-buttons">
        <a href="/" class="nav-button nav-home">
          <i class="fas fa-home"></i>
        </a>
      </div>
      <div class="title-wrapper">
        <h1 class="main-title"><span class="icon">📅</span> 연차 계산기</h1>
        <p class="subtitle">입사일/퇴사일 기준 연차 및 보상금 계산</p>
      </div>
    </div>
    <div class="form-area">
      <div class="input-group">
        <label for="joinDate">입사일</label>
        <input 
          id="joinDate" 
          v-model="form.joinDate" 
          type="date" 
          @keyup="handleDateInput($event, 'joinDate')"
        />
      </div>

      <div class="input-group">
        <label for="leaveDate">퇴사일</label>
        <div class="date-input-wrapper">
          <input 
            id="leaveDate" 
            v-model="form.leaveDate" 
            type="date" 
            @keyup="handleDateInput($event, 'leaveDate')"
          />
          <button @click="setTodayDate" class="today-btn">오늘</button>
        </div>
      </div>

      <div class="input-group">
        <label for="usedDays">사용한 연차일수</label>
        <input 
          id="usedDays" 
          v-model.number="form.usedDays" 
          type="number" 
          min="0"
          placeholder="0"
        />
      </div>

      <div class="input-group">
        <label for="monthlyWage">월급 (₩)</label>
        <input 
          id="monthlyWage" 
          v-model="formattedWage" 
          type="text" 
          @input="formatWageInput"
          placeholder="0"
        />
      </div>

      <div class="btn-group">
        <button @click="calculateLeave" class="btn">연차 계산하기</button>
        <button @click="insertTestData" class="btn btn-secondary">TEST</button>
        <button @click="resetForm" class="btn btn-secondary">RESET</button>
      </div>
    </div>
    <div v-if="result" class="result-section">
      <h2 class="result-title">📊 연차 계산 결과 비교</h2>
      
      <!-- 총 근무기간을 별도로 표시 -->
      <div class="service-period-box">
        <h3>총 근무기간</h3>
        <p>{{ result.joinBased.serviceYears }} ({{ result.joinBased.totalDays }}일)</p>
      </div>
      
      <table class="result-table">
        <thead>
          <tr>
            <th>구분</th>
            <th>입사일 기준</th>
            <th>회계연도 기준</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>적용 비율</td>
            <td>{{ result.joinBased.isUnderOneYear ? '1년 미만' : '1년 이상' }}</td>
            <td>
              {{ result.fiscalBased.fiscalRatio ? (result.fiscalBased.fiscalRatio * 100).toFixed(1) : '0.0' }}%
              <br/>
              <small v-if="result.fiscalBased.workingMonths">
                ({{ result.fiscalBased.workingMonths }}개월 근무)
              </small>
            </td>
          </tr>
          <tr>
            <td>발생 연차</td>
            <td>{{ result.joinBased.annualLeave }}일</td>
            <td>{{ result.fiscalBased.annualLeave }}일</td>
          </tr>
          <tr>
            <td>사용 연차</td>
            <td>{{ result.joinBased.usedDays }}일</td>
            <td>{{ result.fiscalBased.usedDays }}일</td>
          </tr>
          <tr class="highlight-row"> 
            <td>잔여 연차<br /><small>(퇴사 연도 기준)</small></td>
            <td>{{ result.joinBased.remainingDays }}일</td>
            <td>
              {{ result.fiscalBased.remainingDays }}일
            </td>
          </tr>
          <tr>
            <td>일일 임금</td>
            <td>₩{{ Number(result.joinBased.dailyWage).toLocaleString() }}</td>
            <td>₩{{ Number(result.fiscalBased.dailyWage).toLocaleString() }}</td>
          </tr>
          <tr class="highlight-row compensation">
            <td>보상금액</td>
            <td>₩{{ Number(result.joinBased.compensation).toLocaleString() }}</td>
            <td>₩{{ Number(result.fiscalBased.compensation).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>연차휴가보상비
              <span
                title="연차휴가보상비 = ROUNDUP(월급 * 1.463 / 209 * 8) × 미사용 연차"
                style="cursor: help; color: #4b5563; font-weight: bold; margin-left: 6px;"
              >ℹ️</span>
            </td>
            <td>{{ Number(result.joinBased.vacationCompensation).toLocaleString() }}원</td>
            <td>{{ Number(result.fiscalBased.vacationCompensation).toLocaleString() }}원</td>
          </tr>
          <tr>
            <td>기본급<br /><small>(퇴사월 11일 근무 기준)</small>
              <span
                title="기본급 = ROUNDUP(월급 / 월 총일수) × 근무일수"
                style="cursor: help; color: #4b5563; font-weight: bold; margin-left: 6px;"
              >ℹ️</span>
            </td>
            <td>{{ Number(result.joinBased.basicSalary).toLocaleString() }}원</td>
            <td>{{ Number(result.fiscalBased.basicSalary).toLocaleString() }}원</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="notice-section">
      <div class="notice-title">
        <span class="notice-icon">📌</span>
        <span>안내사항</span>
      </div>
      <ul>
        <li>연차/휴가는 입사일 기준으로 계산됩니다. 회사의 회계연도에 따라 ±1일 차이가 있을 수 있습니다.</li>
        <li>본 계산기는 연차를 사용하지 않았다는 가정하에 총 연차 일수를 계산합니다.</li>
        <li>
          연차/휴가 산정 기준:
          <ul>
            <li>1년 미만: 1개월 개근 시 유급휴가 1일씩 부여 (최대 11일)</li>
            <li>1년 이상: 근속 1년마다 15일 부여</li>
            <li>3년 이상: 매 2년마다 1일 추가 부여 (최대 25일)</li>
            <li>'17.05.30 이후 입사자부터 1년 미만 근로자에게 월 1개 연차 부여</li>
            <li>'20.03.31 이후 1년 미만 근로자의 연차는 입사일로부터 1년간 사용 가능</li>
          </ul>
        </li>
        <li>본 계산 결과는 참고용이며 법적 효력이 없습니다.</li>
        <li>실제 연차 부여는 회사 내부규정에 따라 다를 수 있습니다.</li>
      </ul>
    </div>
    <div v-if="error" class="text-red-500 mt-4">{{ error }}</div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CalcDate',
  data() {
    return {
      form: {
        joinDate: '',
        leaveDate: '',
        usedDays: 0,
        monthlyWage: 0,
      },
      result: null,
      error: null,
    };
  },
  computed: {
    formattedWage: {
      get() {
        return this.form.monthlyWage ? Number(this.form.monthlyWage).toLocaleString() : '';
      },
      set(value) {
        const numericValue = value.replace(/[^0-9]/g, '');
        this.form.monthlyWage = numericValue ? parseInt(numericValue) : 0;
      }
    }
  },
  methods: {
    async calculateLeave() {
      if (!this.form.leaveDate) {
        this.form.leaveDate = this.getTodayDate();
      }
      
      try {
        this.error = null;
        const response = await axios.post('http://localhost:3000/api/calculate-leave', this.form);
        this.result = response.data;
      } catch (err) {
        this.result = null;
        this.error = err.response?.data?.error || '서버 오류가 발생했습니다.';
      }
    },
    
    getTodayDate() {
      const today = new Date();
      return today.toISOString().split('T')[0];
    },
    
    setTodayDate() {
      this.form.leaveDate = this.getTodayDate();
    },
    
    handleDateInput(event, field) {
      const input = event.target;
      const value = input.value.replace(/[^0-9]/g, '');
      
      if (value.length === 4 && field === 'joinDate') {
        const nextInput = document.getElementById('leaveDate');
        if (nextInput) {
          nextInput.focus();
        }
      }
    },
    
    formatWageInput(event) {
      const value = event.target.value.replace(/[^0-9]/g, '');
      if (value) {
        event.target.value = parseInt(value).toLocaleString();
      }
    },
    
    insertTestData() {
      this.form = {
        joinDate: '2023-03-02',
        leaveDate: '2025-02-28',
        usedDays: 0,
        monthlyWage: 3344876
      };
    },
    
    resetForm() {
      this.form = {
        joinDate: '',
        leaveDate: '',
        usedDays: 0,  
        monthlyWage: 0
      };
      this.result = null;
      this.error = null;
    }
  }
};
</script>

<style scoped>
.calcdate-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}
.header-area {
  position: relative;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 32px 24px 24px 24px;
  margin: 0 auto 32px auto;
  max-width: 700px;
  text-align: center;
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
.title-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.main-title {
  font-size: 2.2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.2em;
  display: flex;
  align-items: center;
  gap: 10px;
}
.main-title .icon {
  font-size: 2.1rem;
}
.subtitle {
  color: #666;
  font-size: 1.1em;
}
@media (max-width: 768px) {
  .header-area {
    padding: 20px 8px 16px 8px;
  }
  .nav-buttons {
    position: static;
    justify-content: center;
    margin-top: 20px;
  }
  .main-title {
    font-size: 1.3rem;
  }
}
.form-area {
  max-width: 700px;
  margin: 0 auto 2rem auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
}
.container {
  max-width: 700px;
  width: 90%;
  margin: 2rem auto;
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  font-size: 1.1rem;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 2rem;
  text-align: center;
}

.input-group {
  margin-bottom: 1.8rem;
}

.input-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.7rem;
  font-size: 1.1rem;
  color: #374151;
}

.input-group input {
  width: 100%;
  padding: 1rem;
  font-size: 1.2rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.date-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.date-input-wrapper input {
  flex: 1;
}

.today-btn {
  background-color: #e5e7eb;
  color: #374151;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.today-btn:hover {
  background-color: #d1d5db;
}

.btn-group {
  display: flex;
  gap: 1rem;
  margin: 1.5rem 0;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  background-color: #1e40af;
  color: white;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.3s;
  min-width: 150px;
}

.btn:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: #64748b;
}

.result-section {
  margin-top: 2rem;
}

.result-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  text-align: center;
  color: #1e40af;
}

.service-period-box {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.service-period-box h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.5rem;
}

.service-period-box p {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e40af;
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  overflow: hidden;
}

.result-table th,
.result-table td {
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}

.result-table th {
  background-color: #f1f5f9;
  font-weight: 600;
  color: #334155;
}

.result-table tbody tr:hover {
  background-color: #f8fafc;
}

.highlight-row {
  background-color: #eff6ff !important;
  font-weight: 600;
}

.compensation td {
  font-size: 1.1rem;
  color: #1e40af;
}

.error-text {
  color: #dc2626;
  text-align: center;
  margin-top: 1.5rem;
  font-weight: bold;
}

@media screen and (max-width: 480px) {
  .container {
    width: 95%;
    padding: 1rem;
    margin: 1rem auto;
  }
  
  .input-group input {
    padding: 0.8rem;
    font-size: 1.1rem;
  }
  
  .input-group label {
    font-size: 1rem;
  }
  
  .date-input-wrapper {
    flex-direction: column;
  }
  
  .today-btn {
    width: 100%;
  }
  
  .btn {
    width: 100%;
    padding: 0.875rem 1rem;
    margin-bottom: 0.5rem;
  }
  
  .btn-group {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  h1.text-2xl {
    font-size: 1.5rem;
    text-align: center;
  }
  
  .result-table {
    font-size: 0.9rem;
  }
  
  .result-table th,
  .result-table td {
    padding: 0.75rem 0.5rem;
  }
}

.notice-section {
  margin-top: 3rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2rem 2rem 2rem 2rem;
  font-size: 1rem;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  text-align: left;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.notice-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: 700;
  color: #2563eb;
  margin-bottom: 1.2rem;
  justify-content: center;
}
.notice-icon {
  font-size: 1.5rem;
}
.notice-section ul {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin: 0;
}
.notice-section ul ul {
  list-style-type: circle;
  padding-left: 1.5rem;
  margin-top: 0.3rem;
  margin-bottom: 0.3rem;
}
.notice-section li {
  margin-bottom: 0.7rem;
  line-height: 1.7;
  color: #444;
}
</style>