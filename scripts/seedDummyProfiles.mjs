/**
 * seedDummyProfiles.mjs
 *
 * Seeds dummy user profiles into Firestore collections: `users` and `styleProfiles`.
 * Uses the Firebase client SDK with the project's existing config.
 *
 * Usage:
 *   node scripts/seedDummyProfiles.mjs
 *
 * Requirements:
 *   - firebase (already in node_modules)
 */

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'

// ── Firebase config (hardcoded from .env for script use) ──
const firebaseConfig = {
  apiKey: 'AIzaSyB4dTd599QD1cdkEuBUl-pfHS35IkO5iQE',
  authDomain: 'fitting-524.firebaseapp.com',
  projectId: 'fitting-524',
  storageBucket: 'fitting-524.firebasestorage.app',
  messagingSenderId: '980615350018',
  appId: '1:980615350018:web:044dd59aec75263e60a41b',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// ── Helper: Google Drive thumbnail URL ──
function driveUrl(fileId) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`
}

// ── All dummy profiles ──
const DUMMY_PROFILES = [
  // ────────────────────────────────────────────────
  // id 1: 미니멀 시티보이 (M-only)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_1_m',
    nickname: '준혁',
    age: 25,
    gender: 'M',
    archetypeId: 1,
    archetypeName: '미니멀 시티보이',
    archetypeCategory: '미니멀',
    styleTemp: 78,
    keywords: ['미니멀', '모던캐주얼', '깔끔', '시티무드'],
    colorPalette: ['#1c1c1c', '#3d3d3d', '#7a7a7a', '#c8c8c8'],
    dateMoods: ['감성 카페', '사진 전시', '드라이브', '루프탑 바'],
    outfitUrls: [],
    description: '도시적 감성의 정돈된 미니멀 스타일',
  },

  // ────────────────────────────────────────────────
  // id 2: 미니멀 시크걸 (F-only)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_2_f',
    nickname: '지윤',
    age: 24,
    gender: 'F',
    archetypeId: 2,
    archetypeName: '미니멀 시크걸',
    archetypeCategory: '미니멀',
    styleTemp: 76,
    keywords: ['미니멀', '시크', '단정함', '모노톤'],
    colorPalette: ['#1a1a1a', '#4a4a4a', '#8a8a8a', '#d0d0d0'],
    dateMoods: ['미술 전시', '감성 카페', '오마카세', '편집숍'],
    outfitUrls: [],
    description: '군더더기 없는 세련된 무채색 무드',
  },

  // ────────────────────────────────────────────────
  // id 3: 클린 베이직 (M + F)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_3_m',
    nickname: '민재',
    age: 23,
    gender: 'M',
    archetypeId: 3,
    archetypeName: '클린 베이직',
    archetypeCategory: '미니멀',
    styleTemp: 58,
    keywords: ['베이직', '깔끔', '무난', '데일리'],
    colorPalette: ['#ffffff', '#d0d0d0', '#808080', '#2f4f4f'],
    dateMoods: ['영화관', '한강 산책', '브런치 카페', '보드게임 카페'],
    outfitUrls: [driveUrl('14tgKjWZShIu3k5YcCBnlUF8wo9819I0L')],
    description: '기본기가 탄탄한 깔끔한 데일리 스타일',
  },
  {
    userId: 'dummy_3_f',
    nickname: '수빈',
    age: 22,
    gender: 'F',
    archetypeId: 3,
    archetypeName: '클린 베이직',
    archetypeCategory: '미니멀',
    styleTemp: 55,
    keywords: ['베이직', '깔끔', '무난', '데일리'],
    colorPalette: ['#ffffff', '#e0e0e0', '#a0a0a0', '#4a6fa5'],
    dateMoods: ['영화관', '한강 산책', '맛집 탐방', '브런치 카페'],
    outfitUrls: [
      driveUrl('1Z47Q-lcJ_QB2gIjysbs5YY41lvzOJ5Dy'),
      driveUrl('1zOLGyPlUYiZQt_jrPzSeAFS8qD1juNH-'),
      driveUrl('1xt-goBh_9JG2m3okZ8QA-yn-z4KO4meN'),
    ],
    description: '기본에 충실한 깨끗한 데일리 룩',
  },

  // ────────────────────────────────────────────────
  // id 4: 모노톤 무드 (M + F)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_4_m',
    nickname: '서진',
    age: 26,
    gender: 'M',
    archetypeId: 4,
    archetypeName: '모노톤 무드',
    archetypeCategory: '미니멀',
    styleTemp: 72,
    keywords: ['블랙&화이트', '무채색', '절제', '심플'],
    colorPalette: ['#000000', '#333333', '#999999', '#ffffff'],
    dateMoods: ['미술 전시', '감성 카페', '루프탑 바', '인테리어 숍'],
    outfitUrls: [driveUrl('1usR832-MMx2kcwF6Xy6EL-w0umCaD06h')],
    description: '컬러 없이도 분위기가 살아나는 모노톤 마스터',
  },
  {
    userId: 'dummy_4_f',
    nickname: '하은',
    age: 25,
    gender: 'F',
    archetypeId: 4,
    archetypeName: '모노톤 무드',
    archetypeCategory: '미니멀',
    styleTemp: 68,
    keywords: ['블랙&화이트', '무채색', '절제', '심플'],
    colorPalette: ['#0d0d0d', '#4d4d4d', '#b0b0b0', '#f0f0f0'],
    dateMoods: ['미술 전시', '향수 매장', '편집숍', '감성 카페'],
    outfitUrls: [driveUrl('1DEMVTK2z00seIfCMSvuP5VCwnWlpNrpH')],
    description: '무채색 톤 안에서 분위기를 만드는 스타일',
  },

  // ────────────────────────────────────────────────
  // id 5: 쿨톤 미니멀 (M + F)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_5_m',
    nickname: '현우',
    age: 27,
    gender: 'M',
    archetypeId: 5,
    archetypeName: '쿨톤 미니멀',
    archetypeCategory: '미니멀',
    styleTemp: 74,
    keywords: ['블루그레이', '차가운톤', '슬림핏', '절제미'],
    colorPalette: ['#4a6fa5', '#7b8fa1', '#c0ccd8', '#e8ecf0'],
    dateMoods: ['로스터리 카페', '비건/건강식', '요가/필라테스', '서점 나들이'],
    outfitUrls: [driveUrl('1n2YweCbzQvn2fDABNJguQeJRaEQ0NbjD')],
    description: '차가운 색감으로 정돈된 슬림 무드',
  },
  {
    userId: 'dummy_5_f',
    nickname: '예린',
    age: 24,
    gender: 'F',
    archetypeId: 5,
    archetypeName: '쿨톤 미니멀',
    archetypeCategory: '미니멀',
    styleTemp: 76,
    keywords: ['블루그레이', '차가운톤', '슬림핏', '절제미'],
    colorPalette: ['#5b7ea1', '#8ea3b8', '#d1dae3', '#f2f5f8'],
    dateMoods: ['감성 카페', '비건/건강식', '요가/필라테스', '사진 전시'],
    outfitUrls: [driveUrl('1ac-64jGh7lsppRBSP7px3QxUN6hqybez')],
    description: '쿨한 색감의 절제미 넘치는 스타일',
  },

  // ────────────────────────────────────────────────
  // id 6: 릴렉스 캐주얼 (M + F)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_6_m',
    nickname: '도윤',
    age: 24,
    gender: 'M',
    archetypeId: 6,
    archetypeName: '릴렉스 캐주얼',
    archetypeCategory: '캐주얼',
    styleTemp: 47,
    keywords: ['캐주얼', '편안함', '자연스러움', '데일리'],
    colorPalette: ['#5d6d7e', '#aeb6bf', '#d5d8dc', '#f2f3f4'],
    dateMoods: ['영화관', '한강 산책', '맛집 탐방', '보드게임 카페'],
    outfitUrls: [driveUrl('12JxpXADbCQ9a36vH5clAdvd8cwZ9xU6M')],
    description: '편안하고 자연스러운 데일리 룩의 정석',
  },
  {
    userId: 'dummy_6_f',
    nickname: '다은',
    age: 23,
    gender: 'F',
    archetypeId: 6,
    archetypeName: '릴렉스 캐주얼',
    archetypeCategory: '캐주얼',
    styleTemp: 44,
    keywords: ['캐주얼', '편안함', '자연스러움', '데일리'],
    colorPalette: ['#6b705c', '#a5a58d', '#b6ad90', '#ddbea9'],
    dateMoods: ['영화관', '한강 산책', '맛집 탐방', '캠핑'],
    outfitUrls: [driveUrl('1E3Eg1n-PF52jeYz7ok5UkhhdJbjm4XJ_')],
    description: '힘 빼고 자연스러운 일상의 편안함',
  },

  // ────────────────────────────────────────────────
  // id 7: 스포티 프레시 (M + F)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_7_m',
    nickname: '지호',
    age: 22,
    gender: 'M',
    archetypeId: 7,
    archetypeName: '스포티 프레시',
    archetypeCategory: '캐주얼',
    styleTemp: 53,
    keywords: ['스포츠믹스', '활동적', '컬러풀', '에너지'],
    colorPalette: ['#1e90ff', '#ffffff', '#ff4500', '#2d2d2d'],
    dateMoods: ['한강 산책', '자전거 라이딩', '드라이브', '볼링/당구'],
    outfitUrls: [driveUrl('1gGWTyMoJEqdaEvyOswjmy9jFD1jeW9ve')],
    description: '활력 넘치는 스포티한 프레시 감성',
  },
  {
    userId: 'dummy_7_f',
    nickname: '유진',
    age: 23,
    gender: 'F',
    archetypeId: 7,
    archetypeName: '스포티 프레시',
    archetypeCategory: '캐주얼',
    styleTemp: 50,
    keywords: ['스포츠믹스', '활동적', '컬러풀', '에너지'],
    colorPalette: ['#ff6b35', '#1a73e8', '#ffffff', '#2d2d2d'],
    dateMoods: ['한강 산책', '실내 클라이밍', '맛집 탐방', '테마파크'],
    outfitUrls: [driveUrl('1eKLX-5V-wLr05JBrJWVmcVdEjh4gZIIs')],
    description: '에너지 넘치고 밝은 스포티 감성',
  },

  // ────────────────────────────────────────────────
  // id 8: 코지 무드 (M + F)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_8_m',
    nickname: '태양',
    age: 25,
    gender: 'M',
    archetypeId: 8,
    archetypeName: '코지 무드',
    archetypeCategory: '캐주얼',
    styleTemp: 48,
    keywords: ['니트', '따뜻함', '라운지', '오버핏'],
    colorPalette: ['#c4a882', '#e8dcc8', '#7a5c3e', '#f5e6d3'],
    dateMoods: ['보드게임 카페', '영화관', '스파/찜질방', '만화카페'],
    outfitUrls: [driveUrl('1dgdSlB9rX7j4XceFROC2ISnaOsLFw3Yg')],
    description: '포근한 니트가 잘 어울리는 따뜻한 무드',
  },
  {
    userId: 'dummy_8_f',
    nickname: '소희',
    age: 24,
    gender: 'F',
    archetypeId: 8,
    archetypeName: '코지 무드',
    archetypeCategory: '캐주얼',
    styleTemp: 46,
    keywords: ['니트', '따뜻함', '라운지', '오버핏'],
    colorPalette: ['#d4a574', '#f5e6d3', '#a0785a', '#ffe4c4'],
    dateMoods: ['보드게임 카페', '영화관', '도예 체험', '캔들 만들기'],
    outfitUrls: [driveUrl('1-uWPnSSODSKGFI0mh1LdiZUWUMyljvAi')],
    description: '포근하고 따뜻한 무드의 편안한 스타일',
  },

  // ────────────────────────────────────────────────
  // id 9: 서프 캐주얼 (M + F)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_9_m',
    nickname: '우진',
    age: 23,
    gender: 'M',
    archetypeId: 9,
    archetypeName: '서프 캐주얼',
    archetypeCategory: '캐주얼',
    styleTemp: 42,
    keywords: ['서핑', '리조트', '여유로움', '썸머바이브'],
    colorPalette: ['#00bcd4', '#f5e6cc', '#ff9800', '#4caf50'],
    dateMoods: ['바다/해변', '서핑', '해산물 레스토랑', '여행/당일치기'],
    outfitUrls: [driveUrl('1zq7gDd-PaZAr7bZmUqsHkWVsrf9xLItY')],
    description: '바다가 어울리는 자유로운 서퍼 감성',
  },
  {
    userId: 'dummy_9_f',
    nickname: '민지',
    age: 22,
    gender: 'F',
    archetypeId: 9,
    archetypeName: '서프 캐주얼',
    archetypeCategory: '캐주얼',
    styleTemp: 39,
    keywords: ['서핑', '리조트', '여유로움', '썸머바이브'],
    colorPalette: ['#26c6da', '#ffe0b2', '#ef6c00', '#66bb6a'],
    dateMoods: ['바다/해변', '카약/수상스포츠', '해산물 레스토랑', '여행/당일치기'],
    outfitUrls: [driveUrl('1stl3zTIM7A3csQfpz_4T9COaLGSQaC5H')],
    description: '리조트 무드의 여유로운 썸머 스타일',
  },

  // ────────────────────────────────────────────────
  // id 10: 캠퍼스 프레피 (M + F)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_10_m',
    nickname: '성민',
    age: 22,
    gender: 'M',
    archetypeId: 10,
    archetypeName: '캠퍼스 프레피',
    archetypeCategory: '캐주얼',
    styleTemp: 62,
    keywords: ['캠퍼스', '프레피', '니트조끼', '체크'],
    colorPalette: ['#1b4332', '#f2e8cf', '#bc6c25', '#606c38'],
    dateMoods: ['북카페', '뮤지엄', '브런치 카페', '골프/스크린골프'],
    outfitUrls: [driveUrl('1YHfjCJKRoSQgKwrX0TxsPVxv29vZGQ-v')],
    description: '캠퍼스 감성의 프레피 스타일',
  },
  {
    userId: 'dummy_10_f',
    nickname: '채원',
    age: 23,
    gender: 'F',
    archetypeId: 10,
    archetypeName: '캠퍼스 프레피',
    archetypeCategory: '캐주얼',
    styleTemp: 60,
    keywords: ['캠퍼스', '프레피', '니트조끼', '체크'],
    colorPalette: ['#264653', '#e9c46a', '#f4a261', '#2a9d8f'],
    dateMoods: ['북카페', '한강 산책', '브런치 카페', '베이킹 클래스'],
    outfitUrls: [driveUrl('1deeZUW9wEfOFEmYu0q2XVZ8BHgQi4eg-')],
    description: '깔끔한 캠퍼스 무드의 프레피 스타일',
  },

  // ────────────────────────────────────────────────
  // id 11: 어반 스트릿 (M + F)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_11_m',
    nickname: '재현',
    age: 24,
    gender: 'M',
    archetypeId: 11,
    archetypeName: '어반 스트릿',
    archetypeCategory: '스트릿',
    styleTemp: 68,
    keywords: ['스트릿', '오버핏', '그래픽', '하이탑'],
    colorPalette: ['#1a1a1a', '#555555', '#e74c3c', '#ffffff'],
    dateMoods: ['콘서트', '팝업스토어', '맛집 탐방', '드라이브'],
    outfitUrls: [driveUrl('1fztVfLqo-F0o-QLTdXpEV70-cNrWhTJI')],
    description: '스트릿 감성으로 도시를 누비는 타입',
  },
  {
    userId: 'dummy_11_f',
    nickname: '하윤',
    age: 25,
    gender: 'F',
    archetypeId: 11,
    archetypeName: '어반 스트릿',
    archetypeCategory: '스트릿',
    styleTemp: 65,
    keywords: ['스트릿', '오버핏', '그래픽', '하이탑'],
    colorPalette: ['#0d0d0d', '#404040', '#ff3366', '#f5f5f5'],
    dateMoods: ['콘서트', '팝업스토어', '방탈출', '볼링/당구'],
    outfitUrls: [driveUrl('10deAN-deGj2GWspcIkkjo_XvMWAu2pcL')],
    description: '도시형 스트릿의 쿨한 여성 감성',
  },

  // ────────────────────────────────────────────────
  // id 13: 테크웨어 무드 (M + F)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_13_m',
    nickname: '건우',
    age: 26,
    gender: 'M',
    archetypeId: 13,
    archetypeName: '테크웨어 무드',
    archetypeCategory: '스트릿',
    styleTemp: 82,
    keywords: ['테크웨어', '기능성', '올블랙', '미래적'],
    colorPalette: ['#0a0a0a', '#1a1a1a', '#2d2d2d', '#00ff88'],
    dateMoods: ['방탈출', 'VR체험', '실내 클라이밍', '스키/보드'],
    outfitUrls: [driveUrl('1_XmGnfvvh6NHN9zJ8o92Fcs3_tX11zHJ')],
    description: '기능적이고 미래지향적인 올블랙 무드',
  },
  {
    userId: 'dummy_13_f',
    nickname: '서연',
    age: 24,
    gender: 'F',
    archetypeId: 13,
    archetypeName: '테크웨어 무드',
    archetypeCategory: '스트릿',
    styleTemp: 79,
    keywords: ['테크웨어', '기능성', '올블랙', '미래적'],
    colorPalette: ['#0d0d0d', '#222222', '#3a3a3a', '#00e5ff'],
    dateMoods: ['방탈출', 'VR체험', '스키/보드', '사격/양궁체험'],
    outfitUrls: [driveUrl('1VKmA19Ghu4_Nlkk84Q2YXWH6HaViYMgb')],
    description: '기능성과 스타일을 겸비한 미래적 무드',
  },

  // ────────────────────────────────────────────────
  // id 14: 스케이터 바이브 (M + F)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_14_m',
    nickname: '시우',
    age: 23,
    gender: 'M',
    archetypeId: 14,
    archetypeName: '스케이터 바이브',
    archetypeCategory: '스트릿',
    styleTemp: 57,
    keywords: ['스케이트', '루즈핏', '그런지', '로고'],
    colorPalette: ['#2d2d2d', '#8b4513', '#ff6347', '#f5f5dc'],
    dateMoods: ['펍', '포장마차/야시장', '게임/PC방', '맛집 탐방'],
    outfitUrls: [driveUrl('1879G2D9RTR1pkKEMfpJj3Zd3GcEkpMaH')],
    description: '스케이트보드 감성의 자유로운 룩',
  },
  {
    userId: 'dummy_14_f',
    nickname: '지수',
    age: 22,
    gender: 'F',
    archetypeId: 14,
    archetypeName: '스케이터 바이브',
    archetypeCategory: '스트릿',
    styleTemp: 54,
    keywords: ['스케이트', '루즈핏', '그런지', '로고'],
    colorPalette: ['#3d3d3d', '#a0522d', '#ff4500', '#fffff0'],
    dateMoods: ['펍', '포장마차/야시장', '게임/PC방', '놀이공원 야간'],
    outfitUrls: [driveUrl('179_XE9oHv9Jg4yaquAU7NeTftE7as-XH')],
    description: '그런지한 스케이터 감성의 자유로운 스타일',
  },

  // ────────────────────────────────────────────────
  // id 15: 모던 클래식 (M + F)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_15_m',
    nickname: '은호',
    age: 27,
    gender: 'M',
    archetypeId: 15,
    archetypeName: '모던 클래식',
    archetypeCategory: '클래식',
    styleTemp: 78,
    keywords: ['클래식', '단정함', '셔츠', '슬랙스'],
    colorPalette: ['#2c3e50', '#34495e', '#bdc3c7', '#ecf0f1'],
    dateMoods: ['와인바', '재즈바', '오마카세', '루프탑 바'],
    outfitUrls: [driveUrl('1sY7MVxeIk3oARdZfunXNA9PTeA-TIf2l')],
    description: '클래식을 현대적으로 소화하는 댄디한 매력',
  },
  {
    userId: 'dummy_15_f',
    nickname: '서현',
    age: 26,
    gender: 'F',
    archetypeId: 15,
    archetypeName: '모던 클래식',
    archetypeCategory: '클래식',
    styleTemp: 75,
    keywords: ['클래식', '단정함', '셔츠', '슬랙스'],
    colorPalette: ['#34495e', '#5d6d7e', '#d5dbdb', '#f8f9fa'],
    dateMoods: ['와인바', '뮤지컬/연극', '파인다이닝', '한정식'],
    outfitUrls: [driveUrl('11_5hr7JxTYU3UjS7gjOfnnbTrmEp_D-j')],
    description: '현대적으로 재해석한 우아한 클래식',
  },

  // ────────────────────────────────────────────────
  // id 16: 소프트 클래식 (M-only, only M image accessible)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_16_m',
    nickname: '정우',
    age: 25,
    gender: 'M',
    archetypeId: 16,
    archetypeName: '소프트 클래식',
    archetypeCategory: '클래식',
    styleTemp: 72,
    keywords: ['클래식', '부드러움', '뉴트럴', '여성스러움'],
    colorPalette: ['#c9b99a', '#e8dcc8', '#8b7355', '#f5f0eb'],
    dateMoods: ['뮤지컬/연극', '전통 찻집', '한정식', '꽃구경/식물원'],
    outfitUrls: [driveUrl('1_3E6rAtxHCT4UTyFAjY9IpUqqxPss1Oe')],
    description: '우아하고 부드러운 클래식 감성의 소유자',
  },

  // ────────────────────────────────────────────────
  // id 17: 댄디 포멀 (M-only images)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_17_m',
    nickname: '승현',
    age: 28,
    gender: 'M',
    archetypeId: 17,
    archetypeName: '댄디 포멀',
    archetypeCategory: '클래식',
    styleTemp: 91,
    keywords: ['포멀', '수트', '정장감', '세련됨'],
    colorPalette: ['#1b2631', '#2c3e50', '#85929e', '#d5d8dc'],
    dateMoods: ['파인다이닝', '재즈바', '스카이라운지', '뮤지컬/연극'],
    outfitUrls: [
      driveUrl('1Y2hXWhqxtV9UBkwHqvmFba5p90GB4Puv'),
      driveUrl('15WJjbW31VWZm9pRss_QaSwcu30C9nB7u'),
    ],
    description: '수트가 가장 잘 어울리는 클래식 포멀의 정석',
  },

  // ────────────────────────────────────────────────
  // id 18: 비즈캐주얼 무드 (M-only, only M image accessible)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_18_m',
    nickname: '민서',
    age: 27,
    gender: 'M',
    archetypeId: 18,
    archetypeName: '비즈캐주얼 무드',
    archetypeCategory: '클래식',
    styleTemp: 73,
    keywords: ['비즈캐주얼', '오피스룩', '깔끔', '신뢰감'],
    colorPalette: ['#2c3e50', '#95a5a6', '#ecf0f1', '#3498db'],
    dateMoods: ['강연/토크쇼', '골프/스크린골프', '라운지 바', '조용한 레스토랑'],
    outfitUrls: [driveUrl('1hNbck0Hzo2DZ2iJ7gsEbMInqaHpesZZb')],
    description: '일할 때도 센스 있는 오피스 스타일',
  },

  // ────────────────────────────────────────────────
  // id 19: 다크 아티스틱 (M + F)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_19_m',
    nickname: '예준',
    age: 26,
    gender: 'M',
    archetypeId: 19,
    archetypeName: '다크 아티스틱',
    archetypeCategory: '아티스틱',
    styleTemp: 90,
    keywords: ['블랙', '아방가르드', '질감', '실루엣'],
    colorPalette: ['#0a0a0a', '#1a1a1a', '#2d2d2d', '#4a4a4a'],
    dateMoods: ['미술 전시', '와인바', '향수 만들기', '독립영화관'],
    outfitUrls: [driveUrl('16uWS6uULQSYQYVgga2JK4fB4CkLavI9Q')],
    description: '올블랙으로 자신만의 세계관을 구축하는 타입',
  },
  {
    userId: 'dummy_19_f',
    nickname: '나윤',
    age: 25,
    gender: 'F',
    archetypeId: 19,
    archetypeName: '다크 아티스틱',
    archetypeCategory: '아티스틱',
    styleTemp: 88,
    keywords: ['블랙', '아방가르드', '질감', '실루엣'],
    colorPalette: ['#0d0d0d', '#1f1f1f', '#383838', '#555555'],
    dateMoods: ['미술 전시', '향수 매장', '향수 만들기', '독립영화관'],
    outfitUrls: [driveUrl('1L1dwhnJ_IBrsnc90XV79gKrGVw6ICmkW')],
    description: '블랙과 질감으로 아방가르드한 세계를 만드는 스타일',
  },

  // ────────────────────────────────────────────────
  // id 20: 감성 내추럴 (M + F)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_20_m',
    nickname: '유찬',
    age: 24,
    gender: 'M',
    archetypeId: 20,
    archetypeName: '감성 내추럴',
    archetypeCategory: '아티스틱',
    styleTemp: 56,
    keywords: ['어스톤', '내추럴', '오가닉', '차분함'],
    colorPalette: ['#6b5b4b', '#a08c72', '#d4c4a8', '#f0e8d8'],
    dateMoods: ['도예 체험', '북카페', '캠핑', '한강 산책'],
    outfitUrls: [driveUrl('1AodTw6Pyr9KLWpJHBpdxsjFmnDkJ0Df8')],
    description: '자연스럽고 차분한 어스톤 감성파',
  },
  {
    userId: 'dummy_20_f',
    nickname: '혜진',
    age: 23,
    gender: 'F',
    archetypeId: 20,
    archetypeName: '감성 내추럴',
    archetypeCategory: '아티스틱',
    styleTemp: 58,
    keywords: ['어스톤', '내추럴', '오가닉', '차분함'],
    colorPalette: ['#8b7355', '#c4a882', '#e8dcc8', '#5c4a32'],
    dateMoods: ['도예 체험', '북카페', '꽃구경/식물원', '서점 나들이'],
    outfitUrls: [driveUrl('1SWnMLSlLMNFxczfh2ZIOJwz3kjsMyG5d')],
    description: '자연스럽고 차분한 톤의 편안한 감성파',
  },

  // ────────────────────────────────────────────────
  // id 21: 빈티지 로맨틱 (F-only images)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_21_f',
    nickname: '가은',
    age: 24,
    gender: 'F',
    archetypeId: 21,
    archetypeName: '빈티지 로맨틱',
    archetypeCategory: '아티스틱',
    styleTemp: 77,
    keywords: ['빈티지', '레트로', '플로럴', '레이스'],
    colorPalette: ['#8b4513', '#deb887', '#f0e68c', '#cd853f'],
    dateMoods: ['빈티지숍', '도예 체험', '공원 피크닉', '플리마켓'],
    outfitUrls: [
      driveUrl('1WaKS81JPiM6z60k9k_kzac1J9yo7o2wn'),
      driveUrl('1sxWJIlTwGDk8veyEJyN6l7ERZu2teZCx'),
    ],
    description: '과거 감성을 오늘 스타일로 소화하는 빈티지 감각',
  },

  // ────────────────────────────────────────────────
  // id 22: 뉴트로 무드 (M + F)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_22_m',
    nickname: '동현',
    age: 25,
    gender: 'M',
    archetypeId: 22,
    archetypeName: '뉴트로 무드',
    archetypeCategory: '아티스틱',
    styleTemp: 67,
    keywords: ['레트로', '컬러', '올드스쿨', '믹스매치'],
    colorPalette: ['#d4782f', '#2e5090', '#dbb530', '#3a7d44'],
    dateMoods: ['빈티지숍', '레코드샵', '독립영화관', '포장마차/야시장'],
    outfitUrls: [driveUrl('13gW72zMFFU2vOD2WJ8GxaumpBzmCOmLD')],
    description: '복고를 힙하게 해석하는 뉴트로 감각',
  },
  {
    userId: 'dummy_22_f',
    nickname: '은서',
    age: 24,
    gender: 'F',
    archetypeId: 22,
    archetypeName: '뉴트로 무드',
    archetypeCategory: '아티스틱',
    styleTemp: 64,
    keywords: ['레트로', '컬러', '올드스쿨', '믹스매치'],
    colorPalette: ['#e07b39', '#2e5090', '#e8d44d', '#3a7d44'],
    dateMoods: ['빈티지숍', '레코드샵', '팝업스토어', '전통시장'],
    outfitUrls: [driveUrl('1DQjUP_V5rqwS4bc-TuFfVPyeUn3v_Yrc')],
    description: '복고를 새롭게 재해석하는 뉴트로 감성',
  },

  // ────────────────────────────────────────────────
  // id 24: 러블리 페미닌 (F-only)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_24_f',
    nickname: '보라',
    age: 23,
    gender: 'F',
    archetypeId: 24,
    archetypeName: '러블리 페미닌',
    archetypeCategory: '페미닌',
    styleTemp: 80,
    keywords: ['페미닌', '핑크', '프릴', '원피스'],
    colorPalette: ['#f5c6d0', '#e8a0b0', '#fff0f3', '#c98a96'],
    dateMoods: ['공원 피크닉', '디저트 카페', '뮤지컬/연극', '플라워 클래스'],
    outfitUrls: [],
    description: '사랑스러운 컬러감과 디테일로 여성스러움을 표현하는 스타일',
  },

  // ────────────────────────────────────────────────
  // id 25: 걸크러시 시크 (F-only)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_25_f',
    nickname: '수아',
    age: 26,
    gender: 'F',
    archetypeId: 25,
    archetypeName: '걸크러시 시크',
    archetypeCategory: '페미닌',
    styleTemp: 83,
    keywords: ['걸크러시', '파워풀', '모던', '숏컷'],
    colorPalette: ['#0d0d0d', '#333333', '#b0b0b0', '#ff4444'],
    dateMoods: ['칵테일바', '편집숍', '콘서트', '방탈출'],
    outfitUrls: [],
    description: '쿨하고 강한 무드의 자신감 넘치는 스타일',
  },

  // ────────────────────────────────────────────────
  // id 26: 프렌치 시크 (F-only images)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_26_f',
    nickname: '연서',
    age: 25,
    gender: 'F',
    archetypeId: 26,
    archetypeName: '프렌치 시크',
    archetypeCategory: '페미닌',
    styleTemp: 72,
    keywords: ['프렌치', '에포트리스', '베레모', '스트라이프'],
    colorPalette: ['#2c3e50', '#c0392b', '#ecf0f1', '#f5e6cc'],
    dateMoods: ['북카페', '감성 카페', '사진 전시', '브런치 카페'],
    outfitUrls: [
      driveUrl('1_CSRHeZv2rrV7xHUi9RhUG2Vz_mPRGE9'),
      driveUrl('1qjaSCYNJNW7yb6eg56tn3M4nS1JqKW_K'),
    ],
    description: '힘 안 준 듯한데 세련되어 보이는 파리 감성',
  },

  // ────────────────────────────────────────────────
  // id 27: 글램 맥시멀 (F-only images)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_27_f',
    nickname: '다현',
    age: 27,
    gender: 'F',
    archetypeId: 27,
    archetypeName: '글램 맥시멀',
    archetypeCategory: '맥시멀',
    styleTemp: 95,
    keywords: ['화려함', '악세서리', '패턴', '볼드컬러'],
    colorPalette: ['#c9184a', '#ffb703', '#8338ec', '#06d6a0'],
    dateMoods: ['파인다이닝', '콘서트', '칵테일바', '클럽/파티'],
    outfitUrls: [
      driveUrl('1amdlpsSrgY-XwhkC0yqmv4TqGtKxt5UA'),
      driveUrl('1QdKJsfTv9fTKsVLB_xPzjZQZe9rJKouI'),
    ],
    description: '화려하고 존재감 있는 글램 스타일의 정점',
  },

  // ────────────────────────────────────────────────
  // id 29: 아메카지 무드 (M-only images)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_29_m',
    nickname: '하준',
    age: 26,
    gender: 'M',
    archetypeId: 29,
    archetypeName: '아메카지 무드',
    archetypeCategory: '맥시멀',
    styleTemp: 68,
    keywords: ['워크웨어', '빈티지', '내추럴', '레이어드'],
    colorPalette: ['#5c4033', '#8b6914', '#c19a6b', '#36454f'],
    dateMoods: ['캠핑', '빈티지숍', '가죽 공예', '다트/포켓볼'],
    outfitUrls: [
      driveUrl('1h4jyrxW-GquDkchgPqbXFK2KkVjc2HmX'),
      driveUrl('1vBgrSQcmzS1BaNPrlNdFsGb9LCoWFBcn'),
    ],
    description: '워크웨어 기반의 멋스러운 레이어드 마니아',
  },

  // ────────────────────────────────────────────────
  // id 30: 컬러팝 무드 (M + F)
  // ────────────────────────────────────────────────
  {
    userId: 'dummy_30_m',
    nickname: '준서',
    age: 23,
    gender: 'M',
    archetypeId: 30,
    archetypeName: '컬러팝 무드',
    archetypeCategory: '맥시멀',
    styleTemp: 78,
    keywords: ['비비드', '컬러블록', '대담', '펀'],
    colorPalette: ['#ff1744', '#2979ff', '#ffea00', '#00e676'],
    dateMoods: ['테마파크', '놀이공원 야간', '팝업스토어', '맛집 탐방'],
    outfitUrls: [driveUrl('1sG9iU16cZh6HcNiRj7J9Ju52XOuUPXQ7')],
    description: '비비드한 컬러로 에너지를 발산하는 스타일',
  },
  {
    userId: 'dummy_30_f',
    nickname: '하린',
    age: 22,
    gender: 'F',
    archetypeId: 30,
    archetypeName: '컬러팝 무드',
    archetypeCategory: '맥시멀',
    styleTemp: 75,
    keywords: ['비비드', '컬러블록', '대담', '펀'],
    colorPalette: ['#e91e63', '#448aff', '#ffd600', '#00c853'],
    dateMoods: ['테마파크', '놀이공원 야간', '팝업스토어', '콘서트'],
    outfitUrls: [driveUrl('1eBNuaNnbY3R22Azu6jX6aPDzwzEMDoAg')],
    description: '색감으로 승부하는 밝은 에너지 스타일',
  },
]

// ── Seed logic ──

async function seed() {
  console.log(`Seeding ${DUMMY_PROFILES.length} dummy profiles...\n`)

  let success = 0
  let failed = 0

  for (const p of DUMMY_PROFILES) {
    try {
      // 1) Write to `users` collection
      await setDoc(doc(db, 'users', p.userId), {
        nickname: p.nickname,
        gender: p.gender,
        age: p.age,
        outfitUrls: p.outfitUrls,
        createdAt: serverTimestamp(),
      })

      // 2) Write to `styleProfiles` collection
      await setDoc(doc(db, 'styleProfiles', p.userId), {
        userId: p.userId,
        archetypeId: p.archetypeId,
        archetypeName: p.archetypeName,
        archetypeCategory: p.archetypeCategory,
        styleTemp: p.styleTemp,
        keywords: p.keywords,
        colorPalette: p.colorPalette,
        dateMoods: p.dateMoods,
        description: p.description,
        generatedAt: serverTimestamp(),
      })

      console.log(`  [OK] ${p.userId} (${p.nickname}, ${p.gender}, ${p.archetypeName})`)
      success++
    } catch (err) {
      console.error(`  [FAIL] ${p.userId}: ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone! Success: ${success}, Failed: ${failed}`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
