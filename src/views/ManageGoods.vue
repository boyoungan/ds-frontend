<template>
  <div class="manage-goods">
    <div class="manage-goods-header">
      <div class="nav-buttons">
        <a href="/" class="nav-button nav-home">
          <i class="fas fa-home"></i> 
        </a>
        <!-- <template v-if="!isLoggedIn">
          <a href="/login" class="nav-button nav-login">
            <i class="fas fa-sign-in-alt"></i> 로그인
          </a>
        </template>
        <template v-else>
          <button @click="handleLogout" class="nav-button nav-logout">
            <i class="fas fa-sign-out-alt"></i> 로그아웃
          </button>
        </template> -->
      </div>
      <h1>💸소모품 관리</h1>
      <p>소모품 및 비품 등록 및 재고 관리</p>
    </div>

    <div class="manage-goods__actions">
      <div class="search-section">
        <select v-model="searchYear">
          <option value="">전체 연도</option>
          <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
        </select>
        <select v-model="searchMonth" @change="searchGoods">
          <option value="">전체 월</option>
          <option v-for="month in 12" :key="month" :value="month">{{ month }}월</option>
        </select>
        <input type="text" v-model="searchKeyword" placeholder="상품명 검색" @keyup.enter="searchGoods" />
        <button @click="searchGoods" class="btn btn-primary btn-sm">검색</button>
      </div>
      <div class="action-buttons">
        <button @click="openImportModal" class="btn btn-warning">
          <i class="fas fa-file-upload"></i>&nbsp;엑셀 업로드
        </button>
        <button @click="downloadExcel" class="btn btn-info" :disabled="isDownloading">
          <i class="fas fa-file-download"></i>&nbsp; {{ isDownloading ? '다운로드 중...' : '엑셀 다운로드' }}
        </button>
        <button @click="openAddModal" class="btn btn-success">
          <i class="fas fa-plus-circle"></i>&nbsp;상품 등록
        </button>
      </div>

    </div>

    <!-- 컨트롤 영역: 페이지당 개수 선택 & 총 개수/합계 표시 -->
    <div class="table-controls">
      <div class="table-summary">
        <span>총 {{ totalItems }} 건</span>
        <span class="total-amount">
          | 현재 페이지 합계: {{ formatPrice(currentPageTotalAmount) }} 원
          <!-- <span v-if="typeof totalSum !== 'undefined' && totalSum !== null"> (총금액 {{ formatPrice(totalSum) }}원)</span> -->
        </span>
      </div>
      <div class="items-per-page">
        <span>페이지당</span>
        <select id="itemsPerPage" v-model.number="itemsPerPage" @change="handleItemsPerPageChange">
          <option v-for="opt in itemsPerPageOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <span>개</span>
      </div>
    </div>

    <!-- 상품 목록 테이블 -->
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th style="width: 48px; text-align: center;">No.</th>
            <th style="text-align: left;">상품명</th>
            <th style="text-align: left;">카테고리</th>
            <th style="text-align: right;">
              가격 정보
              <i class="fas fa-info-circle" title="클릭하여 상세 가격 정보 확인"></i>
            </th>
            <th style="text-align: right;">구매수량</th>
            <th style="text-align: center;">등록일</th>
            <th class="hide-mobile" style="text-align: left;">부서명</th>
            <th style="text-align: center;">관리</th>
          </tr>
        </thead>
        <tbody v-if="goods.length > 0">
          <template v-for="(item, index) in goods" :key="item.id">
            <tr>
              <td style="text-align: center;">{{ calculateIndex(index) }}</td>
              <td style="text-align: left;">{{ item.name }}</td>
              <td style="text-align: left;">{{ item.category }}</td>
              <td style="text-align: right;" @click="togglePriceDetails(index)" class="price-cell">
                {{ formatPrice(item.unitPrice) }}원
                <span class="more-info">
                  <span class="arrow-icon" :class="{ 'arrow-up': item.showPriceDetails }">▼</span>
                </span>
              </td>
              <td style="text-align: right;">{{ item.purchaseQuantity }}</td>
              <td style="text-align: center;">{{ formatDate(item.createdAt) }}</td>
              <td class="hide-mobile" style="text-align: left;">{{ item.department }}</td>
              <td class="action-cell" style="text-align: center;">
                <button @click="viewDetail(item)" class="btn btn-info btn-action">상세</button>
                <button @click="openEditModal(item)" class="btn btn-warning btn-action">수정</button>
                <button @click="confirmDelete(item)" class="btn btn-danger btn-action">삭제</button>
              </td>
            </tr>
            <tr v-if="item.showPriceDetails" class="price-details-row">
              <td colspan="8">
                <div class="price-details">
                  <div class="price-detail-item">
                    <span class="label">단가:</span>
                    <span class="value">{{ formatPrice(item.unitPrice) }}원</span>
                  </div>
                  <div class="price-detail-item">
                    <span class="label">부가세:</span>
                    <span class="value">{{ formatPrice(item.vat) }}원</span>
                  </div>
                  <div class="price-detail-item">
                    <span class="label">배송비:</span>
                    <span class="value">{{ formatPrice(item.delivery) }}원</span>
                  </div>
                  <div class="price-detail-item">
                    <span class="label">공급가액:</span>
                    <span class="value">{{ formatPrice(item.supplyvalue) }}원</span>
                  </div>
                  <div class="price-detail-item">
                    <span class="label">총 공급대가:</span>
                    <span class="value">{{ formatPrice(item.totalconsideration) }}원</span>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="7" class="text-center">등록된 상품이 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 페이지네이션 -->
    <div class="pagination-wrapper">
      <div class="pagination">
        <a href="#" class="page-btn" :class="{ disabled: currentPage === 1 }" @click.prevent="changePage(1)">
          <span class="icon">⏮️</span>
        </a>
        <a href="#" class="page-btn" :class="{ disabled: currentPage === 1 }"
          @click.prevent="changePage(currentPage - 1)">
          <span class="icon">◀️</span>
        </a>
        <a v-for="page in pageNumbers" :key="page" href="#" class="page-num"
          :class="{ active: page === currentPage, ellipsis: page === '...' }"
          @click.prevent="page !== '...' && changePage(page)">
          <span v-if="page === '...'">…</span>
          <span v-else>{{ page }}</span>
        </a>
        <a href="#" class="page-btn" :class="{ disabled: currentPage === totalPages }"
          @click.prevent="changePage(currentPage + 1)">
          <span class="icon">▶️</span>
        </a>
        <a href="#" class="page-btn" :class="{ disabled: currentPage === totalPages }"
          @click.prevent="changePage(totalPages)">
          <span class="icon">⏭️</span>
        </a>
      </div>
    </div>

    <!-- 상품 등록/수정 모달 -->
    <div v-if="showGoodsModal" class="modal-overlay">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditMode ? '상품 수정' : '상품 등록' }}</h3>
          <button @click="closeGoodsModal" class="modal-close-btn"><span class="visually-hidden">닫기</span></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="isEditMode ? updateGoods() : addGoods()">
            <div class="form-row">
              <div class="form-group">
                <label for="name">상품명 <span class="required">*</span></label>
                <input type="text" id="name" v-model="goodsForm.name" required>
              </div>
              <div class="form-group">
                <label for="category">카테고리 <span class="required">*</span></label>
                <select id="category" v-model="goodsForm.category" required>
                  <option value="" disabled>카테고리 선택</option>
                  <option v-for="category in categories" :key="category.id" :value="category.name">
                    {{ category.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="unitPrice">단가 <span class="required">*</span></label>
                <input type="text" id="unitPrice" v-model="formattedUnitPrice" required>
              </div>
              <div class="form-group">
                <label for="purchaseQuantity">구매수량 <span class="required">*</span></label>
                <input type="number" id="purchaseQuantity" v-model="goodsForm.purchaseQuantity" min="0" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="vat">부가세</label>
                <div class="vat-input-group">
                  <input type="text" id="vat" v-model="formattedVat" @input="calculatePrices"
                    :readonly="goodsForm.vatYn === 'Y'">
                  <div class="vat-checkbox">
                    <input type="checkbox" id="vatYn" v-model="vatChecked">
                    <label for="vatYn">부가세 적용 (단가의 10%)</label>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label for="delivery">배송비</label>
                <input type="text" id="delivery" v-model="formattedDelivery" @input="calculatePrices">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="supplyvalue">공급가액</label>
                <input type="text" id="supplyvalue" :value="formatPrice(goodsForm.supplyvalue)" readonly>
              </div>
              <div class="form-group">
                <label for="totalconsideration">공급대가</label>
                <input type="text" id="totalconsideration" :value="formatPrice(goodsForm.totalconsideration)" readonly>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="department">부서명</label>
                <input type="text" id="department" v-model="goodsForm.department">
              </div>
              <div class="form-group">
                <label for="supplierId">공급처</label>
                <select id="supplierId" v-model="goodsForm.supplierId" required>
                  <option value="" disabled>공급처 선택</option>
                  <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
                    {{ supplier.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-group description-group">
              <label for="description">상품 설명</label>
              <textarea id="description" v-model="goodsForm.description" rows="4  "></textarea>
            </div>

            <div class="form-group">
              <label for="imageFile">상품 이미지</label>
              <div class="file-input-wrapper">
                <label class="file-input-label">
                  <i class="fas fa-upload"></i> <!-- Font Awesome 아이콘 (선택사항) -->
                  <span>파일 선택</span>
                  <input type="file" id="imageFile" @change="handleImageChange" accept="image/*">
                </label>
                <span v-if="goodsForm.imageFile" class="file-name">{{ goodsForm.imageFile.name }}</span>
              </div>
              <div v-if="goodsForm.imageUrl" class="image-preview">
                <img :src="getImageUrl(goodsForm.imageUrl)" alt="상품 이미지 미리보기">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeGoodsModal">취소</button>
              <button type="submit" class="btn btn-primary">저장</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 상품 삭제 확인 모달 -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-container modal-sm" @click.stop>
        <div class="modal-header">
          <h3>상품 삭제</h3>
          <button @click="closeDeleteModal" class="modal-close-btn"></button>
        </div>
        <div class="modal-body">
          <p>정말로 <strong>{{ selectedGoods?.name }}</strong> 상품을 삭제하시겠습니까?</p>
          <p class="text-danger">이 작업은 되돌릴 수 없습니다.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeDeleteModal">취소</button>
          <button type="button" class="btn btn-danger" @click="deleteGoods">삭제</button>
        </div>
      </div>
    </div>

    <!-- 상품 상세 모달 -->
    <div v-if="showDetailModal" class="modal-overlay">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>상품 상세 정보</h3>
          <button @click="closeDetailModal" class="modal-close-btn"></button>
        </div>
        <div class="modal-body" v-if="selectedGoods">
          <div class="detail-container">
            <div class="detail-image">
              <img :src="getImageUrl(selectedGoods.imageUrl)" alt="상품 이미지" @click="openImageModal(selectedGoods.imageUrl)" style="cursor: pointer;" />
            </div>
            <div class="detail-info">
              <h3>{{ selectedGoods.name }}</h3>
              <span class="category-badge">{{ selectedGoods.category }}</span>
              <dl class="info-list">
                <dt>가격</dt>
                <dd>{{ formatPrice(selectedGoods.unitPrice) }}원</dd>
                <dt>구매수량</dt>
                <dd>{{ selectedGoods.purchaseQuantity }}개</dd>
                <dt>등록일</dt>
                <dd>{{ formatDate(selectedGoods.createdAt) }}</dd>
                <dt>수정일</dt>
                <dd>{{ formatDate(selectedGoods.updatedAt) }}</dd>
                <dt>부서명</dt>
                <dd>{{ selectedGoods.department }}</dd>
                <dt>부가세</dt>
                <dd>{{ formatPrice(selectedGoods.vat) }}원</dd>
                <dt>배송비</dt>
                <dd>{{ formatPrice(selectedGoods.delivery) }}원</dd>
                <dt>공급가액</dt>
                <dd>{{ formatPrice(selectedGoods.supplyvalue) }}원</dd>
                <dt>공급대가</dt>
                <dd>{{ formatPrice(selectedGoods.totalconsideration)  }}원</dd>
              </dl>
              <div class="description-section">
                <h4>상품 설명</h4>
                <p>{{ selectedGoods.description || '상품 설명이 없습니다.' }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeDetailModal">닫기</button>
          <button type="button" class="btn btn-warning" @click="openEditModalFromDetail">수정</button>
        </div>
      </div>
    </div>

    <!-- 엑셀 업로드 모달 -->
    <div v-if="showImportModal" class="modal-overlay">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>엑셀 파일로 상품 등록</h3>
          <button @click="closeImportModal" class="modal-close-btn"><span class="visually-hidden">닫기</span></button>
        </div>
        <div class="modal-body">
          <div class="import-instructions">
            <p>엑셀 파일(.xlsx, .xls)만 업로드할 수 있습니다.</p>
            <!-- <p>샘플 파일이 필요하면 <a href="/api/goods/sample-excel" download>여기</a>를 클릭하세요.</p> -->
          </div>
          <input type="file" @change="handleExcelChange" accept=".xlsx,.xls" />
          <div v-if="excelFile" class="file-name">선택된 파일: {{ excelFile.name }}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeImportModal">취소</button>
            <button type="button" class="btn btn-primary" @click="importExcel" :disabled="importStatus.importing">
              업로드
            </button>
          </div>
          <div v-if="importStatus.importing" class="import-status">업로드 중...</div>
          <div v-if="importStatus.result" class="import-result">
            <div v-if="importStatus.result.success > 0" class="alert alert-success">
              {{ importStatus.result.message }}
            </div>
            <div v-else class="alert alert-danger">
              {{ importStatus.result.message }}
            </div>
            <div
              v-if="importStatus.result.details && importStatus.result.details.errors && importStatus.result.details.errors.length > 0"
              class="error-details">
              <h4>오류 상세</h4>
              <table class="error-table">
                <thead>
                  <tr>
                    <th>코드</th>
                    <th>이름</th>
                    <th>오류</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="err in importStatus.result.details.errors" :key="err.code + err.name">
                    <td>{{ err.code }}</td>
                    <td>{{ err.name }}</td>
                    <td>{{ err.error }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 이미지 확대 모달 -->
    <div v-if="showImageModal" class="modal-overlay" @click="closeImageModal">
      <div class="image-modal-container" @click.stop>
        <button @click="closeImageModal" class="modal-close-btn"></button>
        <img :src="selectedImageUrl" alt="상품 이미지 원본" class="full-size-image" />
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ManageGoods',
  data() {
    const now = new Date();
    return {
      goods: [],
      categories: [
        { id: 1, name: '식음료' },
        { id: 2, name: '사무용품' },
        { id: 3, name: '소모품' },
        { id: 4, name: 'PC' },
        { id: 5, name: '모니터터' },
        { id: 6, name: '기타' },
      ],
      searchKeyword: '',
      currentPage: 1,
      itemsPerPage: 10,
      itemsPerPageOptions: [10, 20, 50, 100],
      totalItems: 0,
      totalPages: 1,
      totalSum: 0,

      // 모달 상태 관리
      showGoodsModal: false,
      showDeleteModal: false,
      showDetailModal: false,

      // 선택된 상품 정보
      selectedGoods: null,

      // 상품 폼 데이터
      goodsForm: {
        id: null,
        name: '',
        category: '',
        unitPrice: 0,
        vatYn: 'N',
        supplierId: '',
        purchaseQuantity: 0,
        description: '',
        department: '',
        vat: 0,
        delivery: 0,
        supplyvalue: 0,
        totalconsideration: 0,
        imageUrl: '',
        imageFile: null
      },

      // 모드 (추가/수정)
      isEditMode: false,

      // 엑셀 업로드 관련 변수
      excelFile: null,
      importStatus: {
        importing: false,
        progress: 0,
        result: null
      },
      showImportModal: false,
      showErrorDetails: false,
      vatChecked: false, // 부가세 적용 체크박스 상태 기본값을 false로 변경
      suppliers: [
        { id: '1', name: '인터넷최저가' },
        { id: '2', name: 'MRO' },
        { id: '3', name: '기타' }
      ],
      searchYear: now.getFullYear().toString(),
      searchMonth: (now.getMonth() + 1).toString(),
      isDownloading: false, // Flag to indicate download status
      isLoggedIn: false,
      showImageModal: false,
      selectedImageUrl: '',
    };
  },
  computed: {
    pageNumbers() {
      return this.getPagination(this.currentPage, this.totalPages, 7);
    },
    formattedUnitPrice: {
      get() {
        return this.formatPrice(this.goodsForm.unitPrice);
      },
      set(value) {
        const numericValue = value.replace(/[^\d]/g, '');
        this.goodsForm.unitPrice = numericValue ? parseInt(numericValue) : 0;
        this.calculatePrices();
      }
    },
    formattedVat: {
      get() {
        return this.formatPrice(this.goodsForm.vat);
      },
      set(value) {
        const numericValue = value.replace(/[^\d]/g, '');
        this.goodsForm.vat = numericValue ? parseInt(numericValue) : 0;
        this.calculatePrices();
      }
    },
    formattedDelivery: {
      get() {
        return this.formatPrice(this.goodsForm.delivery);
      },
      set(value) {
        const numericValue = value.replace(/[^\d]/g, '');
        this.goodsForm.delivery = numericValue ? parseInt(numericValue) : 0;
        this.calculatePrices();
      }
    },
    yearOptions() {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 10 }, (_, i) => currentYear - i);
    },
    currentPageTotalAmount() {
      if (!this.goods || this.goods.length === 0) {
        return 0;
      }
      return this.goods.reduce((sum, item) => {
        // item.totalconsideration 값이 유효한 숫자인지 확인 후 더함
        const amount = Number(item.totalconsideration) || 0;
        return sum + amount;
      }, 0);
    }
  },
  methods: {
    // 토큰 유효성 검사 및 데이터 로드
    checkTokenAndFetchData() {
      const token = localStorage.getItem('token');
      
      if (!token) {
        this.$router.push('/login');
        return;
      }
      
      try {
        // JWT 디코딩 및 만료 확인
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // JWT의 exp는 초 단위
        const currentTime = Date.now();
        
        if (currentTime >= expirationTime) {
          console.log('토큰이 만료되었습니다.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.$router.push('/login');
          return;
        }
        
        // 토큰이 유효하면 데이터 로드
        this.isLoggedIn = true;
        this.fetchGoods();
      } catch (e) {
        console.error('토큰 파싱 오류:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.$router.push('/login');
      }
    },
    openImportModal() {
      this.excelFile = null;
      this.importStatus = {
        importing: false,
        progress: 0,
        result: null
      };
      this.showErrorDetails = false;
      this.showImportModal = true;
    },

    closeImportModal() {
      if (!this.importStatus.importing) {
        this.showImportModal = false;
      } else {
        alert('데이터 처리 중에는 닫을 수 없습니다. 잠시만 기다려주세요.');
      }
    },

    handleExcelChange(event) {
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop().toLowerCase();
      if (fileExt !== 'xlsx' && fileExt !== 'xls') {
        alert('Excel 형식(.xlsx, .xls)의 파일만 업로드 가능합니다.');
        return;
      }

      this.excelFile = file;
      this.importStatus.result = null;
    },

    async importExcel() {
      if (!this.excelFile) {
        alert('엑셀 파일을 선택해주세요.');
        return;
      }

      try {
        this.importStatus.importing = true;
        this.importStatus.progress = 10;

        const formData = new FormData();
        formData.append('excelFile', this.excelFile);

        this.importStatus.progress = 30;

        const response = await axios.post('/api/goods/import', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        this.importStatus.progress = 100;
        this.importStatus.result = {
          success: response.data.details.success,
          failed: response.data.details.failed,
          message: response.data.message,
          details: response.data.details
        };

        if (response.data.details.success > 0) {
          this.fetchGoods();
        }
      } catch (error) {
        console.error('엑셀 가져오기 실패:', error);
        this.importStatus.result = {
          success: 0,
          failed: 1,
          message: '엑셀 파일 처리 중 오류가 발생했습니다.',
          details: {
            errors: [{
              code: '',
              name: '',
              error: error.response?.data?.message || error.message
            }]
          }
        };
      } finally {
        this.importStatus.importing = false;
      }
    },

    toggleErrorDetails() {
      this.showErrorDetails = !this.showErrorDetails;
    },

    async fetchGoods() {
      try {
        const response = await axios.get('/api/goods', {
          params: {
            page: this.currentPage,
            limit: this.itemsPerPage,
            keyword: this.searchKeyword,
            year: this.searchYear,
            month: this.searchMonth
          }
        });

        this.goods = response.data.items.map(item => ({
          ...item,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          purchaseQuantity: item.purchaseQuantity ?? 0,
          unitPrice: item.unitPrice ?? 0,
          vat: item.vat ?? 0,
          delivery: item.delivery ?? 0,
          supplyvalue: (item.unitPrice ?? 0) * (item.purchaseQuantity ?? 0),
          totalconsideration: ((item.unitPrice ?? 0) * (item.purchaseQuantity ?? 0)) + (item.vat ?? 0) + (item.delivery ?? 0),
          showPriceDetails: false
        }));
        this.totalItems = response.data.totalItems;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.totalSum = response.data.totalSum;
        // console.log('totalSum:', this.totalSum);
      } catch (error) {
        console.error('상품 목록 조회 실패:', error);
        alert('상품 목록을 불러오는데 실패했습니다.');
      }
    },

    async fetchCategories() {
      //임시로 잠시 막아둠 (나중에 카테고리 추가 시 사용)
      // try {
      //   const response = await axios.get('/api/categories');
      //   this.categories = response.data;
      // } catch (error) {
      //   console.error('카테고리 목록 조회 실패:', error);
      // }
    },

    searchGoods() {
      this.currentPage = 1;
      this.fetchGoods();
    },

    changePage(page) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      this.fetchGoods();
    },

    calculateIndex(index) {
      return (this.currentPage - 1) * this.itemsPerPage + index + 1;
    },

    formatPrice(price) {
      return new Intl.NumberFormat('ko-KR').format(price || 0);
    },

    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    },

    handleImageChange(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.goodsForm.imageFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.goodsForm.imageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    },

    resetForm() {
      this.goodsForm = {
        id: null,
        name: '',
        category: '',
        unitPrice: 0,
        vatYn: 'N',
        supplierId: '1',
        purchaseQuantity: 0,
        description: '',
        department: '',
        vat: 0,
        delivery: 0,
        supplyvalue: 0,
        totalconsideration: 0,
        imageUrl: '',
        imageFile: null
      };
      this.vatChecked = false;
      this.isEditMode = false;
    },

    closeGoodsModal() {
      this.showGoodsModal = false;
    },

    closeDeleteModal() {
      this.showDeleteModal = false;
    },

    closeDetailModal() {
      this.showDetailModal = false;
    },

    openAddModal() {
      this.resetForm();
      this.showGoodsModal = true;
    },

    openEditModal(item) {
      this.isEditMode = true;
      this.goodsForm = {
        id: item.id,
        name: item.name,
        category: item.category,
        unitPrice: item.unitPrice,
        vatYn: item.vatYn || 'N',
        supplierId: item.supplierId || '1',
        purchaseQuantity: item.purchaseQuantity,
        description: item.description || '',
        department: item.department || '',
        vat: item.vat || 0,
        delivery: item.delivery || 0,
        supplyvalue: item.supplyvalue || 0,
        totalconsideration: item.totalconsideration || 0,
        imageUrl: item.imageUrl || '',
        imageFile: null
      };
      this.vatChecked = this.goodsForm.vatYn === 'Y';
      this.showGoodsModal = true;
    },

    openEditModalFromDetail() {
      if (this.selectedGoods) {
        this.closeDetailModal();
        setTimeout(() => {
          this.openEditModal(this.selectedGoods);
        }, 300);
      }
    },

    viewDetail(item) {
      this.selectedGoods = { ...item };
      // Ensure imageUrl is properly formatted
      if (this.selectedGoods.imageUrl && !this.selectedGoods.imageUrl.startsWith('http') && !this.selectedGoods.imageUrl.startsWith('/')) {
        this.selectedGoods.imageUrl = `/${this.selectedGoods.imageUrl}`;
      }
      this.showDetailModal = true;
    },

    confirmDelete(item) {
      this.selectedGoods = item;
      this.showDeleteModal = true;
    },

    async addGoods() {
      try {
        const formData = new FormData();
        formData.append('code', this.goodsForm.code);
        formData.append('name', this.goodsForm.name);
        formData.append('category', this.goodsForm.category);
        formData.append('unitPrice', this.goodsForm.unitPrice);
        formData.append('purchaseQuantity', this.goodsForm.purchaseQuantity);
        formData.append('description', this.goodsForm.description);
        formData.append('vatYn', this.goodsForm.vatYn);
        formData.append('supplierId', this.goodsForm.supplierId);
        formData.append('status', this.goodsForm.status);
        formData.append('department', this.goodsForm.department);
        formData.append('vat', this.goodsForm.vat);
        formData.append('delivery', this.goodsForm.delivery);
        formData.append('supplyvalue', this.goodsForm.supplyvalue);
        formData.append('totalconsideration', this.goodsForm.totalconsideration);

        if (this.goodsForm.imageFile) {
          formData.append('image', this.goodsForm.imageFile);
        }

        await axios.post('/api/goods', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        alert('상품이 등록되었습니다.');
        this.closeGoodsModal();
        this.fetchGoods();
      } catch (error) {
        console.error('상품 등록 실패:', error);
        alert('상품 등록에 실패했습니다. 다시 시도해주세요.');
      }
    },

    async updateGoods() {
      try {
        const formData = new FormData();
        formData.append('code', this.goodsForm.code);
        formData.append('name', this.goodsForm.name);
        formData.append('category', this.goodsForm.category);
        formData.append('unitPrice', this.goodsForm.unitPrice);
        formData.append('purchaseQuantity', this.goodsForm.purchaseQuantity);
        formData.append('description', this.goodsForm.description);
        formData.append('vatYn', this.goodsForm.vatYn);
        formData.append('supplierId', this.goodsForm.supplierId);
        formData.append('status', this.goodsForm.status);
        formData.append('department', this.goodsForm.department);
        formData.append('vat', this.goodsForm.vat);
        formData.append('delivery', this.goodsForm.delivery);
        formData.append('supplyvalue', this.goodsForm.supplyvalue);
        formData.append('totalconsideration', this.goodsForm.totalconsideration);

        if (this.goodsForm.imageFile) {
          formData.append('image', this.goodsForm.imageFile);
        }

        await axios.put(`/api/goods/${this.goodsForm.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        alert('상품이 수정되었습니다.');
        this.closeGoodsModal();
        this.fetchGoods();
      } catch (error) {
        console.error('상품 수정 실패:', error);
        alert('상품 수정에 실패했습니다. 다시 시도해주세요.');
      }
    },

    async deleteGoods() {
      if (!this.selectedGoods) return;

      try {
        await axios.delete(`/api/goods/${this.selectedGoods.id}`);
        alert('상품이 삭제되었습니다.');
        this.closeDeleteModal();
        this.fetchGoods();
      } catch (error) {
        console.error('상품 삭제 실패:', error);
        alert('상품 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    },

    handleEscape(event) {
      if (event.key === 'Escape') {
        if (this.showImageModal) {
          this.closeImageModal();
          return;
        }
        if (this.showGoodsModal) this.closeGoodsModal();
        if (this.showDeleteModal) this.closeDeleteModal();
        if (this.showDetailModal) this.closeDetailModal();
      }
    },

    // fillTestData() {
    //   this.goodsForm = {
    //     id: this.goodsForm.id,
    //     name: '테스트 상품',
    //     category: this.categories[0]?.name || '식품',
    //     unitPrice: 12345.67,
    //     vatYn: 'Y',
    //     supplierId: '1',
    //     purchaseQuantity: 50,
    //     description: '이것은 테스트용 상품 설명입니다.',
    //     department: '영업부',
    //     vat: 1000,
    //     delivery: 5000,
    //     supplyvalue: 50000,
    //     totalconsideration: 60000,
    //     imageUrl: '',
    //     imageFile: null
    //   };
    // },
    calculatePrices() {
      const unitPrice = parseInt(this.goodsForm.unitPrice) || 0;
      const quantity = parseInt(this.goodsForm.purchaseQuantity) || 0;
      const delivery = parseInt(this.goodsForm.delivery) || 0;
      // 부가세: 단가의 10%
      const vat = this.vatChecked ? Math.round(unitPrice * 0.1) : 0;

      this.goodsForm.vat = vat; // 입력란에도 반영
      this.goodsForm.supplyvalue = unitPrice * quantity;
      this.goodsForm.totalconsideration = (unitPrice + vat) * quantity + delivery;
    },
    togglePriceDetails(index) {
      this.goods[index].showPriceDetails = !this.goods[index].showPriceDetails;
    },
    getPagination(current, total, maxLength = 7) {
      if (maxLength < 5) throw "maxLength must be at least 5";
      if (total <= maxLength) {
        return Array.from({ length: total }, (_, i) => i + 1);
      }
      const sideWidth = maxLength < 9 ? 1 : 2;
      const leftWidth = (maxLength - sideWidth * 2 - 3) >> 1;
      const rightWidth = (maxLength - sideWidth * 2 - 3) >> 1;
      if (current <= maxLength - sideWidth - 1 - rightWidth) {
        return [
          ...Array.from({ length: maxLength - sideWidth - 1 }, (_, i) => i + 1),
          "...",
          ...Array.from({ length: sideWidth }, (_, i) => total - sideWidth + 1 + i)
        ];
      }
      if (current >= total - sideWidth - 1 - leftWidth) {
        return [
          ...Array.from({ length: sideWidth }, (_, i) => i + 1),
          "...",
          ...Array.from({ length: maxLength - sideWidth - 1 }, (_, i) => total - (maxLength - sideWidth - 1) + 1 + i)
        ];
      }
      return [
        ...Array.from({ length: sideWidth }, (_, i) => i + 1),
        "...",
        ...Array.from({ length: leftWidth + rightWidth + 1 }, (_, i) => current - leftWidth + i),
        "...",
        ...Array.from({ length: sideWidth }, (_, i) => total - sideWidth + 1 + i)
      ];
    },
    handleItemsPerPageChange() {
      this.currentPage = 1;
      this.fetchGoods();
    },
    async downloadExcel() {
      if (this.isDownloading) return; // Prevent multiple downloads

      this.isDownloading = true;
      try {
        const response = await axios.get('/api/goods/export', {
          params: {
            keyword: this.searchKeyword,
            year: this.searchYear,
            month: this.searchMonth
          },
          responseType: 'blob' // Important for file download
        });

        // Extract filename from Content-Disposition header if available
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'goods_export.xlsx'; // Default filename
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename\*?=UTF-8''(.+)|filename="?(.+)"?/);
          if (filenameMatch && filenameMatch.length > 1) {
             // Decode URI component for UTF-8 filenames
            filename = decodeURIComponent(filenameMatch[1] || filenameMatch[2]);
          }
        }

        // Create a URL for the blob object
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename); // Use the extracted or default filename
        document.body.appendChild(link);
        link.click();

        // Clean up
        link.remove();
        window.URL.revokeObjectURL(url);

        // No alert needed here as the download starts automatically

      } catch (error) {
        console.error('엑셀 다운로드 실패:', error);
        // Attempt to read error message from blob if it's JSON
        if (error.response && error.response.data instanceof Blob && error.response.data.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const errData = JSON.parse(reader.result);
                    alert(`엑셀 다운로드에 실패했습니다: ${errData.message || '서버 오류'}`);
                } catch (parseError) {
                    alert('엑셀 다운로드에 실패했습니다. 서버 응답을 처리할 수 없습니다.');
                }
            };
            reader.onerror = () => {
                 alert('엑셀 다운로드에 실패했습니다. 서버 오류 응답을 읽을 수 없습니다.');
            }
            reader.readAsText(error.response.data);
        } else {
             alert('엑셀 다운로드에 실패했습니다. 네트워크 오류 또는 서버 문제일 수 있습니다.');
        }
      } finally {
        this.isDownloading = false;
      }
    },
    handleLogout() {
      // Implement logout logic here
      this.isLoggedIn = false;
      // Add your logout logic (e.g., clearing tokens, redirecting)
    },
    getImageUrl(url) {
      if (!url) return '/no-image.png';
      if (url.startsWith('http') || url.startsWith('data:')) return url;
      return url.startsWith('/') ? url : `/${url}`;
    },
    openImageModal(imageUrl) {
      this.selectedImageUrl = this.getImageUrl(imageUrl);
      this.showImageModal = true;
    },
    closeImageModal() {
      this.showImageModal = false;
    },
  },
  watch: {
    vatChecked(newValue) {
      this.goodsForm.vatYn = newValue ? 'Y' : 'N';
      if (newValue) {
        // 부가세 입력란: 단가의 10%
        const unitPrice = parseInt(this.goodsForm.unitPrice.toString().replace(/,/g, '')) || 0;
        this.goodsForm.vat = Math.round(unitPrice * 0.1);
      } else {
        this.goodsForm.vat = 0;
      }
      this.calculatePrices();
    },
    'goodsForm.unitPrice': {
      handler(newValue) {
        if (this.vatChecked) {
          const unitPrice = parseInt(newValue.toString().replace(/,/g, '')) || 0;
          this.goodsForm.vat = Math.round(unitPrice * 0.1);
        }
        this.calculatePrices();
      }
    },
    'goodsForm.purchaseQuantity': {
      handler() {
        this.calculatePrices();
      }
    }
  },
  created() {
    this.checkTokenAndFetchData();
  },
  mounted() {
    this.fetchGoods();
    this.fetchCategories();
    window.addEventListener('keydown', this.handleEscape);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleEscape);
  }
};
</script>

<style scoped>
.manage-goods {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 40px 20px;
  font-family: 'Segoe UI', sans-serif;
  color: #333;
  max-width: 1200px;
  margin: 0 auto;
}

.manage-goods-header {
  text-align: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.manage-goods-header h1 {
  font-size: 2.5em;
  color: #2c3e50;
  margin-bottom: 10px;
}

.manage-goods-header p {
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

.nav-login {
  background-color: #42b983;
  color: white;
  border: none;
}

.nav-login:hover {
  background-color: #3aa876;
}

.nav-logout {
  background-color: #dc3545;
  color: white;
  border: none;
}

.nav-logout:hover {
  background-color: #c82333;
}

@media (max-width: 768px) {
  .nav-buttons {
    position: static;
    justify-content: center;
    margin-top: 20px;
  }
}

.manage-goods__actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  background-color: #fff;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.manage-goods select {
  height: 40px;
  line-height: 1.5;
  padding: 4px 8px;
  box-sizing: border-box;
  font-size: 14px;
}

.search-section {
  display: flex;
  gap: 10px;
}

.search-section input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  transition: all 0.3s ease;
}

.search-section input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.1);
}

.table-responsive {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 24px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

table th {
  background-color: #f9f9f9;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #35495e;
  border-bottom: 2px solid #eee;
}

table td {
  padding: 12px 16px;
  vertical-align: middle;
  border-bottom: 1px solid #eee;
}

table tr:hover {
  background-color: #f8f9fa;
}

.text-center {
  text-align: center;
}

/* 컨트롤 영역: 페이지당 개수 선택 & 총 개수/합계 표시 */
.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}

.table-summary {
  padding: 10px 15px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.95em;
  color: #495057;
}

.table-summary span {
  font-weight: 500;
}

.table-summary .total-amount {
  margin-left: 15px;
  color: #333;
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.98em;
}

.items-per-page select {
  padding: 6px 10px;
  border-radius: 5px;
  border: 1px solid #ddd;
  font-size: 0.9em;
  height: 38px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23555'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 10px 6px;
  padding-right: 32px;
  background-color: #fff;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  line-height: 1.5;
  box-sizing: border-box;
}

/* 페이지네이션 중앙 정렬 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  /* 중앙 정렬 */
  margin-top: 30px;
  margin-bottom: 30px;
}

.pagination {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 페이지네이션 버튼 스타일 */
.page-btn,
.page-num {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 35px;
  height: 35px;
  border-radius: 8px;
  color: #555;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  font-weight: 500;
  border: none;
  background-color: #f5f7fa;
}

.page-btn {
  background-color: transparent;
}

.page-btn .icon {
  font-size: 1.2rem;
}

.page-btn:hover,
.page-num:hover {
  background-color: #e9f3ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.page-num.active {
  background-color: #00a6ed;
  color: white;
  box-shadow: 0 4px 8px rgba(122, 153, 193, 0.2);
}

.page-btn.disabled,
.page-num.disabled {
  color: #ccc;
  cursor: not-allowed;
  pointer-events: none;
  background-color: #f8f8f8;
  box-shadow: none;
}

.page-num.ellipsis {
  cursor: default;
  background: transparent;
  box-shadow: none;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #212529;
  font-size: 1.3em;
  font-weight: 600;
}

.modal-body {
  padding: 24px;
  flex: 1;
}

.modal-footer {
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.form-row {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  width: 100%;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group input,
.form-group select {
  width: 100%;
  box-sizing: border-box;
}

.form-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  height: 42px;
  margin-right: 8px;
  background: #fff;
  transition: border-color 0.3s;
  padding-right: 32px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23495057'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 10px 6px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  line-height: 1.5;
  box-sizing: border-box;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #495057;
  font-size: 0.95rem;
}

.required {
  color: #dc3545;
  margin-left: 4px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  background-color: #fff;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4dabf7;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
}

.form-group.description-group {
  margin-bottom: 28px;
  margin-right: 28px;
}

.radio-group {
  display: flex;
  gap: 24px;
  margin-top: 8px;
  margin-bottom: 20px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.radio-option input[type="radio"] {
  width: 18px;
  height: 18px;
  margin: 0;
}

.radio-option label {
  margin-bottom: 0;
  cursor: pointer;
}

.modal-close-btn {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  transition: all 0.2s ease;
  background-color: #f0f0f0;
  padding: 0;
  line-height: 0;
}

.modal-close-btn:hover {
  background-color: #e2e6ea;
  color: #343a40;
}

.modal-close-btn:before {
  content: "×";
  display: block;
  font-size: 24px;
  line-height: 1;
}

.modal-close-btn span {
  display: none;
}

.image-preview {
  margin-top: 16px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 8px;
  display: inline-block;
  background-color: #f8f9fa;
}

.image-preview img {
  max-height: 150px;
  max-width: 100%;
  border-radius: 4px;
}

.detail-container {
  display: flex;
  gap: 32px;
  align-items: flex-start;
  padding: 16px 0;
}

.detail-image {
  width: 220px;
  min-width: 180px;
  background: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.detail-image img {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
  border-radius: 6px;
  background: #fff;
}

.detail-info {
  flex: 1;
  padding: 8px 0;
}

.detail-info h3 {
  margin: 0 0 8px 0;
  font-size: 1.5em;
  color: #222;
}

.category-badge {
  display: inline-block;
  background: #eaf6f3;
  color: #42b983;
  border-radius: 12px;
  padding: 4px 12px;
  font-size: 0.95em;
  margin-bottom: 16px;
}

.info-list {
  margin: 16px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  padding: 12px 0;
  display: grid;
  grid-template-columns: 100px 1fr;
  row-gap: 8px;
}

.info-list dt {
  color: #888;
  font-weight: 500;
}

.info-list dd {
  margin: 0 0 0 8px;
  color: #333;
}

.description-section {
  margin-top: 18px;
  background: #f6f8fa;
  border-radius: 8px;
  padding: 14px 16px;
}

.description-section h4 {
  margin: 0 0 8px 0;
  color: #35495e;
  font-size: 1.1em;
}

.btn {
  padding: 10px 16px;
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background-color: #0d6efd;
  color: white;
}

.btn-primary:hover {
  background-color: #0b5ed7;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5c636a;
}

.btn-success {
  background-color: #198754;
  color: white;
}

.btn-success:hover {
  background-color: #157347;
}

input[type="file"] {
  margin-top: 8px;
  padding: 8px 0;
}

.file-input-wrapper {
  position: relative;
  display: inline-block;
  margin-top: 8px;
}

.file-input-label {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #495057;
}

.file-input-label:hover {
  background-color: #e9ecef;
}

.file-input-label span {
  margin-left: 8px;
}

.file-input-wrapper input[type="file"] {
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.file-name {
  margin-left: 8px;
  font-size: 0.9rem;
  color: #6c757d;
}

.required {
  color: #e74c3c;
}

.badge {
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.bg-success {
  background-color: #42b983;
  color: white;
}

.bg-secondary {
  background-color: #6c757d;
  color: white;
}

.text-danger {
  color: #e74c3c !important;
}

.action-cell {
  min-width: 120px;
  text-align: center;
}

.btn-action {
  font-size: 0.8rem;
  padding: 4px 8px;
  margin: 0 2px;
  min-width: 40px;
  min-height: 28px;
}

@media (max-width: 1024px) {
  .hide-mobile {
    display: none !important;
  }
}

@media (max-width: 768px) {
  .manage-goods {
    padding: 20px 15px;
  }

  .manage-goods__actions {
    flex-direction: column;
    gap: 16px;
  }

  .search-section {
    flex-wrap: wrap;
    gap: 8px;
  }

  .search-section select,
  .search-section input,
  .search-section button {
    width: 100%;
    margin-right: 0;
  }

  .form-row {
    flex-direction: column;
    gap: 24px;
  }

  .detail-container {
    flex-direction: column;
    gap: 18px;
    align-items: stretch;
  }

  .detail-image {
    width: 100%;
    min-width: 0;
    margin-bottom: 8px;
  }

  .hide-mobile {
    display: none !important;
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.import-instructions {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 12px 15px;
  margin-bottom: 16px;
  font-size: 0.9rem;
  color: #666;
}

.import-instructions p {
  margin: 6px 0;
}

.progress {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  margin: 12px 0;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #4caf50;
  transition: width 0.3s ease;
}

.import-status {
  margin: 16px 0;
  text-align: center;
  color: #666;
}

.import-result {
  margin-top: 16px;
}

.alert {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.alert-success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.alert-danger {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.error-details {
  margin-top: 16px;
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
}

.error-details h4 {
  font-size: 1rem;
  margin-top: 0;
  margin-bottom: 12px;
  color: #721c24;
}

.error-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.error-table th,
.error-table td {
  padding: 8px;
  border-bottom: 1px solid #dee2e6;
  text-align: left;
}

.error-table th {
  font-weight: 600;
  background-color: #f1f1f1;
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

.btn-outline-danger {
  background-color: transparent;
  border: 1px solid #dc3545;
  color: #dc3545;
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  color: white;
}

.price-cell {
  cursor: pointer;
  user-select: none;
  position: relative;
  padding-right: 24px !important;
}

.price-cell:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.price-cell .more-info {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  font-size: 0.85em;
  color: #666;
}

.price-cell .more-text {
  font-size: 0.85em;
  color: #2196f3;
}

.price-cell:hover .more-info {
  color: #2196f3;
}

.price-details-row {
  background-color: #f8f9fa;
}

.price-details {
  padding: 1rem;
  display: flex;
  gap: 2rem;
  justify-content: space-around;
  flex-wrap: wrap;
}

.price-detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.price-detail-item .label {
  font-weight: bold;
  color: #666;
}

.price-detail-item .value {
  color: #333;
  font-size: 1.1em;
}

.price-cell .arrow-icon {
  display: inline-block;
  font-size: 0.8em;
  transition: transform 0.2s ease;
}

.price-cell .arrow-icon.arrow-up {
  transform: rotate(-180deg);
}

.vat-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vat-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vat-checkbox input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.vat-checkbox label {
  margin: 0;
  font-size: 0.9em;
  color: #666;
}

.search-section select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.9rem;
  height: 42px;
  margin-right: 8px;
  background: #fff;
  transition: border-color 0.3s;
  padding-right: 32px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23495057'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 10px 6px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  line-height: 1.5;
  box-sizing: border-box;
}

.search-section select:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.1);
}

/* Add style for download button if needed, e.g., spacing */
.action-buttons .btn-info {
 /* Example: Add some margin if buttons are too close */
 /* margin-left: 8px; */
}

/* Optional: Add a visual cue while downloading */
.btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.image-modal-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.full-size-image {
  max-width: 100%;
  max-height: calc(90vh - 40px);
  object-fit: contain;
}

.image-modal-container .modal-close-btn {
  position: absolute;
  top: -15px;
  right: -15px;
  background: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #666;
  z-index: 1;
}

.image-modal-container .modal-close-btn:hover {
  background: #f0f0f0;
}

.detail-image img {
  transition: transform 0.2s ease;
}

.detail-image img:hover {
  transform: scale(1.05);
}
</style>