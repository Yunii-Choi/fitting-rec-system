# 핏팅 (Fitting) — 매칭 엔진

패션 기반 데이팅 앱. OOTD 사진에서 스타일 피처를 추출해 **스타일이 닮은 사람끼리 매칭(유유상종)**. 외모가 아니라 스타일·꾸밈 바이브로 연결한다.

---

## 지금 작업 (current focus)

오프라인 **30×30 아키타입 유사도 행렬(M) 구축**.
- 입력: 아키타입별 대표 이미지 `matching/anchors/{archetype_id}/*.png`
- 출력: `matching/artifacts/M.json` (+ 검수 리포트)

### 아직 구현 금지 (미확정 🔴)
- `matching/data/keywords.json` — 키워드 통제 어휘 사전 (엑셀 동의어 통합 필요)
- `matching/extract/schema.py` — 추출 LLM 출력 JSON 스키마
- 위 둘이 확정되기 전에는 런타임 추출/스코어링 코드는 stub/인터페이스만 둔다.

---

## 매칭 설계 요약

**2단계: 게이트(하드 필터) → 스코어(유사도 가중합).**

- **게이트** — 성별/지향, 나이로 후보 풀 결정. 유사도 아님(맞으면 후보, 아니면 제외).
- **스코어** — 4축 가중합 → `sync_raw`(0~100) → 일관도 압축 → `sync_final`.

| 축 | 유사도 계산 | 가중치 | 데이터 |
|----|------------|--------|--------|
| ① 아키타입 | `M[i][j]` 조회 (분포면 pᵀMq) | 0.40 | archetype_id |
| ② 키워드 | 자카드 (통제 어휘 셋) | 0.30 | profile_keywords |
| ③ 꾸밈온도 | `1 − |Δ|/100` | 0.20 | style_temp (0~100) |
| ④ 컬러 | CIELAB 거리 (hex→Lab) | 0.10 | profile_colors |

무드는 **매칭 제외(가중치 0)** → 매칭 성사 후 "데이트 코스 추천"에만 사용.

**일관도 압축:** `sync_final = 50 + min(κ_X, κ_C) × (sync_raw − 50)`
- κ = 한 유저의 사진들 간 self-유사도(같은 4축 재활용). 0이 아니라 **50(중립)으로 압축**.
- κ는 화면 04에 "스타일 일관도 %"로도 표시(점수·표시 같은 값).
- 결측 축은 0점이 아니라 **가중치 재정규화**.

### 유사도 구현 주의 (중요)
- 임베딩을 쓰는 건 **① 아키타입뿐**, 그것도 **오프라인 M 빌드에서만**. 런타임 매칭 루프에는 임베딩 계산이 없다 — 표 조회 + 집합 연산 + 산수뿐.
- ②키워드가 임베딩 없이 자카드로 되는 건 **통제 어휘** 덕분(문자열 완전 일치). 자유 텍스트 금지.
- ④컬러: CIELAB은 학습 모델이 아니라 색공간 변환 공식. 프로필 생성 시 Lab으로 저장 → 매칭 땐 거리만.

---

## ① 아키타입 — Path 2 (배정=LLM, M=이미지)

- **배정:** LLM이 사진을 보고 archetype_id 선택(상위 top-k + confidence 분포). 키워드·온도·무드도 같은 호출에서.
- **M:** FashionCLIP 이미지 앵커로 **오프라인 1회** 구축. 런타임엔 M 조회만(이미지 인코더 안 돌림).
- **M 빌드 단계:**
  1. 의상 세그멘테이션 크롭 (`mattmdjaga/segformer_b2_clothes`) — 배경+얼굴/피부 제거, 옷만. 앵커 ~300장만 대상.
  2. FashionCLIP(`patrickjohncyh/fashion-clip`) 임베딩 → **L2 정규화**.
  3. 아키타입별 이미지 벡터 평균 → **재정규화** = 앵커.
  4. 앵커끼리 코사인 → 30×30.
  5. **off-diagonal 재스케일**(min→0, max→1, 대각선 1) — 코사인이 0.6~0.9에 몰리는 문제 보정.
  6. **검수: 남↔여 변형이 서로 최근접인지 필수 확인**(시티보이↔시크걸). 이성 매칭의 생명. 이상하면 수동 보정.
- **함정:** 이미지 인코더가 옷이 아니라 사람·배경·성별에 키를 잡을 수 있음 → 그래서 크롭(옷만)과 검수가 필수.

### 추출 분업 (런타임, 장별)
- 의미 피처(아키타입·키워드·무드) = **LLM** (어휘 강제, JSON 출력)
- 컬러 hex = **CV** (LLM은 정확한 hex 못 뽑음)
- 꾸밈온도 = 배정된 아키타입의 온도 범위 안에서 LLM 미세조정(앵커링)
- 사진 1~3장 장별 추출 → 집계(중심 centroid + 일관도 κ). 평균만 내면 일관도 신호가 죽으니 둘 다 보존.

---

## 데이터 모델 (Firebase Firestore, 기존 ERD 12 tables)

- 마스터: `style_archetypes`(30, gender·계열), `style_keywords`(통제 어휘), `date_moods`(100), `outfit_categories`
- 유저/OOTD: `users`, `user_outfits`(사진별, 장별 피처)
- 분석: `style_profiles`(유저별: archetype 분포, style_temp, **consistency κ**), `profile_colors`(hex+Lab), `profile_keywords`/`profile_date_moods`(정션)
- 매칭: `user_likes`(directional), `matches`(mutual, user1_id<user2_id; sync_score 캐시)

---

## 컨벤션

- 한국어 주석 OK.
- 브랜드 V6: 다크 `#0a0a0c` + 라임 `#c8ff00` (UI 작업 시).
- Firebase 프로젝트 `fitting-524` (Firestore + Storage).
- 피처 브랜치: Charles / Clara / Tissue / Jenifer.
- 앵커 이미지는 Google Drive에서 로컬로 받아 `matching/anchors/{archetype_id}/`에 둔다 (Claude Code는 Drive 커넥터 없음).
- 매칭은 학습 모델/라벨 데이터셋 불필요 — 콘텐츠 기반 유사도. (행동 데이터 쌓이면 v2에서 협업 필터링 검토.)
