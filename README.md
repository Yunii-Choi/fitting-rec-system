# fitting 👕

> OOTD 스타일 유사도 기반 데이팅 매칭 앱
> Style Chemistry — 콜드스타트 환경을 위한 콘텐츠 기반 추천

얼굴보다 스타일이 먼저 보이는 데이팅 앱. OOTD 사진에서 스타일 피처를 추출해 스타일 케미가 맞는 사람을 찾아 매칭합니다.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4 + Framer Motion
- **Backend:** Firebase (Auth, Firestore, Storage, Hosting)
- **AI:** Google Gemini 2.5 Flash (이미지 스타일 분석)
- **Matching:** FashionCLIP 기반 아키타입 유사도 행렬 + 4축 가중합

## 매칭 알고리즘 (v2)

콜드스타트 환경에서 행동 데이터 없이 첫 업로드만으로 추천이 작동하는 **콘텐츠 기반 유사도 매칭**.

### 4축 가중합 스코어링

| 축 | 측정 | 가중치 | 데이터 |
|----|------|--------|--------|
| ① 아키타입 | M[i,j] 조회 (FashionCLIP 30x30) | 0.40 | archetype_id |
| ② 키워드 | facet 가중 Jaccard (5 facet, 63 terms) | 0.30 | 통제 어휘 |
| ③ 꾸밈온도 | 1 - \|Δt\|/100 | 0.20 | style_temp 0~100 |
| ④ 컬러 | CIELAB ΔE76 | 0.10 | hex 팔레트 → Lab |

- **데이트무드**: 스코어 제외 → 매칭 후 추천에만 사용
- **일관도 κ 수축**: `sync_final = 50 + min(κ_A, κ_B) × (sync_raw - 50)`
- **결측 축**: 가중치 재정규화 (0점이 아님)

### 키워드 통제 어휘 (facet 구조)

| facet | 가중치 | 예시 |
|-------|--------|------|
| genre | 0.40 | 미니멀, 스트릿, 클래식, 페미닌 ... |
| vibe | 0.25 | 깔끔, 편안함, 화려함, 세련됨 ... |
| fit | 0.15 | 오버핏, 슬림핏, 레이어드, 실루엣 |
| item | 0.15 | 니트, 셔츠, 패턴, 액세서리 ... |
| color | 0.05 | 무채색, 비비드, 어스톤, 쿨톤 ... |

총 63개 canonical term + 109개 raw→canonical 정규화 맵.

### 아키타입 유사도 행렬 M

- **오프라인 1회 구축**: FashionCLIP (ViT-B/32) + segformer 의상 크롭
- 30개 아키타입 × 4장 = 120 앵커 이미지 → 코사인 유사도 → off-diagonal 재스케일
- 런타임에는 M[i][j] 조회만 (임베딩 계산 없음)

## 디렉토리 구조

```
app/
├── src/
│   ├── config/firebase.ts        # Firebase 초기화
│   ├── data/
│   │   ├── archetypeMatrix.ts    # M 매트릭스 (30x30) + 조회 함수
│   │   └── keywordIndex.ts       # facet 통제 어휘 + 정규화 + Jaccard
│   ├── lib/
│   │   ├── api.ts                # Gemini 프롬프트 + 분석/매칭 API
│   │   ├── matching.ts           # 4축 매칭 엔진 (CIELAB, M조회, facet Jaccard)
│   │   ├── masterData.ts         # 30 아키타입 + 100 데이트무드
│   │   ├── firestore.ts          # Firestore CRUD (users, styleProfiles, likes)
│   │   ├── storageUpload.ts      # Firebase Storage 이미지 업로드
│   │   ├── fakeProfiles.ts       # 25개 더미 프로필 (MVP fallback)
│   │   └── driveImages.ts        # Google Drive 더미 이미지 URL
│   ├── types/
│   │   ├── style.ts              # StyleProfile, Archetype, DateMood
│   │   ├── match.ts              # Match
│   │   └── user.ts               # UserProfile
│   ├── stores/                   # Zustand 상태관리
│   ├── pages/                    # 5 screens
│   └── components/               # UI 컴포넌트
├── firestore.rules               # Firestore 보안 규칙
├── storage.rules                 # Storage 보안 규칙
├── firebase.json                 # Hosting 설정
└── .firebaserc                   # 프로젝트 매핑 (fitting-524)
```

## Firebase

- **Project ID:** `fitting-524`
- **Services:** Authentication (Google OAuth), Firestore, Storage, Hosting
- **Web App:** https://fitting-524.web.app

### 데이터 적재 구조

| Firebase 서비스 | 경로 | 내용 |
|----------------|------|------|
| Auth | 자동 | Google 로그인 유저 (UID 발급) |
| Firestore `users/{uid}` | 분석 시 | 닉네임, 성별, 나이, outfitUrls |
| Firestore `styleProfiles/{uid}` | 분석 시 | AI 분석 결과 (아키타입, 키워드, 온도, 컬러, 무드) |
| Firestore `likes/{from}_{to}` | 매칭 시 | 좋아요/패스 액션 |
| Storage `ootd/{uid}/{category}/` | 업로드 시 | OOTD 이미지 원본 |

## 브랜치 전략

| 브랜치 | 담당 | 내용 |
|--------|------|------|
| `main` | 통합 | 머지 브랜치 |
| `feat_charles` | Charles | 앱 MVP + 매칭 엔진 v2 |
| `feat_jenifer` | Jenifer | 추천 알고리즘 Python (M 매트릭스, similarity.py) |
| `feat_clara` | Clara | - |
| `feat_tissue` | Tissue | - |

## 사용자 플로우

1. `/login` — Google OAuth 로그인
2. `/profile` — 닉네임, 성별, 나이 입력
3. `/upload` — OOTD 이미지 업로드 (데일리룩/데이트룩/나다운룩)
4. `/analyzing` — Gemini AI 분석 + Firebase 저장
5. `/style-profile` — 스타일 프로필 결과
6. `/matches` — 매칭 리스트 (좋아요/패스)
