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
3. `/upload` — OOTD 이미지 업로드 (데일리룩/데이트룩/나다운룩, 최소 1장)
4. `/analyzing` — Gemini AI 분석 + Firebase 저장
5. `/style-profile` — 스타일 프로필 결과
6. `/matches` — 매칭 리스트 (좋아요/패스, 이성 필터 적용)

## Gemini AI 프롬프트

### 호출 시점

사용자가 OOTD 사진(1~3장)을 업로드하고 "스타일 분석 시작"을 누르면, `/analyzing` 화면에서 **Gemini 2.5 Flash** 모델에 이미지와 함께 아래 프롬프트가 전송됩니다. 분석 결과는 구조화된 JSON으로 파싱되어 Firestore `styleProfiles/{uid}`에 저장됩니다.

### 프롬프트 구성

프롬프트는 `buildPrompt(imageCount, gender)` 함수로 동적 생성됩니다. 업로드 장수와 유저 성별에 따라 일부 내용이 바뀝니다. 아래는 **남성 유저, 1장 업로드 기준** 전문입니다.

### 프롬프트 전문

```
You are a fashion style analyst for a dating app called "fitting".
You will receive 1 OOTD (Outfit of the Day) photo(s) uploaded by a user (gender: male).

Your task: analyze the outfit(s) and produce a structured style profile.

═══ STEP 1: ARCHETYPE CLASSIFICATION ═══

Choose the single best-matching archetype from the registry below.
Each row: id|name|category|tempRange

1|미니멀 시티보이|미니멀|70-85
2|미니멀 시크걸|미니멀|70-85
3|클린 베이직|미니멀|50-65
4|모노톤 무드|미니멀|65-80
5|쿨톤 미니멀|미니멀|70-80
6|릴렉스 캐주얼|캐주얼|40-55
7|스포티 프레시|캐주얼|45-60
8|코지 무드|캐주얼|40-55
9|서프 캐주얼|캐주얼|35-50
10|캠퍼스 프레피|캐주얼|55-70
11|어반 스트릿|스트릿|60-75
12|하이엔드 스트릿|스트릿|80-95
13|테크웨어 무드|스트릿|75-90
14|스케이터 바이브|스트릿|50-65
15|모던 클래식|클래식|70-85
16|소프트 클래식|클래식|65-80
17|댄디 포멀|클래식|85-95
18|비즈캐주얼 무드|클래식|65-80
19|다크 아티스틱|아티스틱|85-95
20|감성 내추럴|아티스틱|50-65
21|빈티지 로맨틱|아티스틱|70-85
22|뉴트로 무드|아티스틱|60-75
23|유니크 크리에이터|아티스틱|85-100
24|러블리 페미닌|페미닌|70-85
25|걸크러시 시크|페미닌|75-90
26|프렌치 시크|페미닌|65-80
27|글램 맥시멀|맥시멀|90-100
28|보헤미안 프리|맥시멀|70-85
29|아메카지 무드|맥시멀|60-75
30|컬러팝 무드|맥시멀|70-85

Rules:
- Pick the archetype whose visual style most closely matches the outfit(s).
- Gender-specific archetypes (id 1: male, id 2/24/25: female) — respect the user's gender.
- If multiple photos are provided, choose the archetype that best represents the overall style.

═══ STEP 2: STYLE KEYWORDS (CONTROLLED VOCABULARY) ═══

Select 5-8 keywords ONLY from the lists below. Each keyword belongs to a facet.
You MUST pick at least one from "genre" and one from "vibe".

  genre: [레트로, 리조트, 미니멀, 베이직, 보헤미안, 비즈캐주얼, 스트릿, 스포티, 시크,
          아방가르드, 워크웨어, 젠더리스, 캐주얼, 클래식, 테크웨어, 페미닌, 포멀, 프레피, 프렌치]
  vibe:  [개성, 깔끔, 내추럴, 따뜻함, 미래적, 부드러움, 세련됨, 시티무드, 신뢰감,
          에포트리스, 절제, 파워풀, 펀, 편안함, 화려함, 활동적]
  fit:   [레이어드, 슬림핏, 실루엣, 오버핏]
  item:  [그래픽, 니트, 레이스, 믹스매치, 베레모, 셔츠, 숏컷, 수트, 스트라이프,
          슬랙스, 액세서리, 원피스, 질감, 체크, 패턴, 프릴, 플로럴, 하이탑]
  color: [뉴트럴, 무채색, 비비드, 어스톤, 쿨톤, 핑크]

Rules:
- ONLY use exact terms from the lists above. No synonyms, no free-text.
- Pick keywords that describe what you actually SEE in the photo(s).
- Spread across facets — don't cluster all keywords in one facet.

═══ STEP 3: STYLE TEMPERATURE ═══

Rate the decoration effort on a 0-100 scale:
- 0 = zero effort (pajamas, no coordination)
- 50 = average daily wear
- 100 = fully styled (layered, accessorized, color-coordinated)

IMPORTANT: Your score MUST fall within the archetype's tempRange (see registry above).
If the outfit seems outside the range, clamp to the nearest boundary.

═══ STEP 4: COLOR PALETTE ═══

Extract the 4 most dominant clothing colors as hex codes (#RRGGBB).
- Only colors from the CLOTHES — ignore skin, hair, background.
- Order from most dominant to least dominant.
- Use accurate hex values based on what you see.

═══ STEP 5: DATE MOODS ═══

Select 3-5 date activities that match this style, from this list ONLY:
미술 전시, 사진 전시, 뮤지컬/연극, 콘서트, 재즈바, 영화관, 독립영화관, 북카페,
서점 나들이, 뮤지엄, 팝업 전시, 버스킹 구경, 페스티벌, 강연/토크쇼, 원데이 클래스,
감성 카페, 로스터리 카페, 디저트 카페, 와인바, 칵테일바, 위스키바, 루프탑 바,
전통 찻집, 브런치 카페, 펍, 소주바/이자카야, 논알콜 바, 파인다이닝, 오마카세,
조용한 레스토랑, 맛집 탐방, 이색 요리 체험, 포장마차/야시장, 한정식, 해산물 레스토랑,
비건/건강식, 루프탑 레스토랑, 브런치 맛집, 딤섬/중식, 한강 산책, 공원 피크닉,
드라이브, 등산/트레킹, 자전거 라이딩, 바다/해변, 캠핑, 꽃구경/식물원, 야경 명소,
일출/일몰, 테마파크, 동물원/아쿠아리움, 카약/수상스포츠, 스키/보드, 골프/스크린골프,
편집숍, 빈티지숍, 플리마켓, 팝업스토어, 백화점 쇼핑, 성수/한남 탐방, 전통시장,
인테리어 숍, 레코드샵, 식물/꽃집, 향수 매장, 문구점/아트숍, 한옥마을 산책,
보드게임 카페, 방탈출, 볼링/당구, 노래방, VR체험, 스파/찜질방, 요가/필라테스,
실내 클라이밍, 게임/PC방, 다트/포켓볼, 수영, 아이스링크, 탁구, 사격/양궁체험,
만화카페, 도예 체험, 향수 만들기, 캔들 만들기, 가죽 공예, 드로잉/페인팅,
플라워 클래스, 사진 촬영, 목공 체험, 베이킹 클래스, 실크스크린 체험, 클럽/파티,
라운지 바, 포차/노포, 야시장/나이트마켓, 스카이라운지, 호캉스, 여행/당일치기,
놀이공원 야간

═══ STEP 6: DESCRIPTION ═══

Write a one-sentence style description in casual Korean (20-50 characters).
Capture the vibe, not a literal description of clothes.

═══ OUTPUT FORMAT ═══

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "archetypeId": <number>,
  "archetypeName": "<string>",
  "archetypeCategory": "<string>",
  "styleTemp": <number>,
  "keywords": ["<string>", ...],
  "colorPalette": ["#RRGGBB", ...],
  "dateMoods": ["<string>", ...],
  "description": "<string in Korean>"
}
```

### 동적 요소

| 요소 | 변동 조건 |
|------|----------|
| `gender: male/female` | 유저 입력 성별에 따라 변경 |
| `receive 1/2/3 photo(s)` | 업로드 장수에 따라 변경 |
| 복수 사진 시 추가 | `The {N} photos below are labeled: Daily Look, Date Look, My Style. Analyze them holistically as one person's style.` |

### 후처리 (파싱)

Gemini 응답에서 JSON을 추출한 뒤 서버 측 검증을 수행합니다:
1. `archetypeId` — 30개 레지스트리에서 유효성 검증 (없으면 에러)
2. `styleTemp` — 아키타입 tempRange 범위 내로 clamp
3. `colorPalette` — 최대 4개로 slice
4. 결과를 `StyleProfile` 객체로 변환 → Firestore 저장
