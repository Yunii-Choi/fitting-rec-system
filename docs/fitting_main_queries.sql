-- ============================================================
-- fitting — 발표용 메인 쿼리 3종
-- ERD V2 · 14 tables · 와이어프레임 화면별 매핑
-- ============================================================


-- ================================================================
-- [쿼리 1] 화면 2-3: OOTD 업로드 → Gemini 분석 → DB INSERT
-- ================================================================
-- 시점: 사용자가 OOTD 사진을 올리고 "스타일 분석 시작"을 누른 뒤,
--       Gemini 2.5 Flash가 이미지를 분석하여 구조화 JSON을 반환하면
--       아래 INSERT 쿼리들이 순차적으로 실행되어 7개 테이블에 적재됩니다.
--
-- 연관 테이블:
--   users, user_outfits, style_profiles,
--   profile_archetypes(★), profile_keywords, profile_colors, profile_date_moods
-- ================================================================

-- ── STEP 1. 사용자 기본 정보 저장 (화면 2: 프로필 입력) ──

INSERT INTO users (user_id, nickname, gender, age, created_at)
VALUES ('uid_001', '하이', 'MALE', 25, NOW());


-- ── STEP 2. OOTD 이미지 저장 (화면 3: 사진 업로드) ──
-- Firebase Storage에 업로드된 이미지의 URL을 기록

INSERT INTO user_outfits (outfit_id, user_id, category_id, image_url, uploaded_at)
VALUES
  (101, 'uid_001', 1, 'gs://fitting-524/ootd/uid_001/daily/1718234567890.jpg', NOW()),
  (102, 'uid_001', 2, 'gs://fitting-524/ootd/uid_001/date/1718234567891.jpg',  NOW()),
  (103, 'uid_001', 3, 'gs://fitting-524/ootd/uid_001/me/1718234567892.jpg',    NOW());


-- ── STEP 3. Gemini 분석 결과 → 스타일 프로필 저장 ──
-- Gemini가 반환한 JSON에서 추출한 값들이 아래 INSERT로 변환됩니다.
--
-- Gemini 응답 원본 (예시):
-- {
--   "archetypeId": 29,
--   "archetypeDistribution": [
--     {"archetypeId": 29, "weight": 0.65},
--     {"archetypeId": 15, "weight": 0.20},
--     {"archetypeId": 20, "weight": 0.15}
--   ],
--   "styleTemp": 70,
--   "consistencyKappa": 0.92,
--   "keywords": [
--     {"keyword": "워크웨어", "weight": 0.95},
--     {"keyword": "캐주얼",   "weight": 0.80},
--     {"keyword": "편안함",   "weight": 0.75},
--     {"keyword": "세련됨",   "weight": 0.70},
--     {"keyword": "시티무드", "weight": 0.65},
--     {"keyword": "레이어드", "weight": 0.60},
--     {"keyword": "셔츠",    "weight": 0.55},
--     {"keyword": "어스톤",  "weight": 0.50}
--   ],
--   "colorPalette": ["#2C3E2D", "#5B7A5E", "#F5F0EB", "#8B4513"],
--   "dateMoods": ["감성 카페", "서점 나들이", "성수/한남 탐방", "와인바", "한강 산책"],
--   "description": "편안한 워크웨어룩에 세련된 시티 감성을 더했어요."
-- }

-- 3-a. 스타일 프로필 메인 테이블
--      archetype_id = 주 아키타입 (분포 중 가장 높은 weight)
--      consistency_kappa = 사진 간 스타일 일관도 (0~1)
INSERT INTO style_profiles
  (profile_id, user_id, archetype_id, style_temp, consistency_kappa, description, generated_at)
VALUES
  (1001, 'uid_001', 29, 70, 0.92,
   '편안한 워크웨어룩에 세련된 시티 감성을 더했어요.', NOW());

-- 3-b. 아키타입 분포 (V2 ★) — Gemini가 추출한 top-3 아키타입 + 확신도
--      M 매트릭스 기반 분포 유사도(pᵀMq) 산출에 사용
INSERT INTO profile_archetypes (profile_id, archetype_id, weight)
VALUES
  (1001, 29, 0.65),   -- 아메카지 무드 (주)
  (1001, 15, 0.20),   -- 모던 클래식   (보조)
  (1001, 20, 0.15);   -- 감성 내추럴   (보조)

-- 3-c. 키워드 (V2: 가중치 ★) — 63개 통제 어휘에서만 추출, facet 자동 귀속
--      weight = Gemini가 판단한 시각적 두드러짐 (1.0=지배적, 0.3=미미)
INSERT INTO profile_keywords (profile_id, keyword_id, weight)
SELECT 1001, k.keyword_id,
       CASE k.keyword
         WHEN '워크웨어' THEN 0.95   -- facet: genre
         WHEN '캐주얼'   THEN 0.80   -- facet: genre
         WHEN '편안함'   THEN 0.75   -- facet: vibe
         WHEN '세련됨'   THEN 0.70   -- facet: vibe
         WHEN '시티무드'  THEN 0.65   -- facet: vibe
         WHEN '레이어드'  THEN 0.60   -- facet: fit
         WHEN '셔츠'     THEN 0.55   -- facet: item
         WHEN '어스톤'   THEN 0.50   -- facet: color
       END
FROM   style_keywords k
WHERE  k.keyword IN ('워크웨어', '캐주얼', '편안함', '세련됨', '시티무드', '레이어드', '셔츠', '어스톤');

-- 3-d. 컬러 팔레트 — 옷에서 추출한 지배적 색상 4개 (hex)
INSERT INTO profile_colors (color_id, profile_id, hex_code, display_order)
VALUES
  (1, 1001, '#2C3E2D', 1),   -- 카키 다크
  (2, 1001, '#5B7A5E', 2),   -- 올리브 그린
  (3, 1001, '#F5F0EB', 3),   -- 아이보리
  (4, 1001, '#8B4513', 4);   -- 새들 브라운

-- 3-e. 데이트 무드 — 100개 목록에서 스타일에 어울리는 장소 3~5개
INSERT INTO profile_date_moods (profile_id, mood_id)
SELECT 1001, dm.mood_id
FROM   date_moods dm
WHERE  dm.mood_name IN ('감성 카페', '서점 나들이', '성수/한남 탐방', '와인바', '한강 산책');


-- ================================================================
-- [쿼리 2] 화면 4: 스타일 프로필 결과 노출 (SELECT)
-- ================================================================
-- 시점: AI 분석이 완료되고 /style-profile 화면으로 이동했을 때,
--       저장된 분석 결과를 조합하여 유저에게 보여줍니다.
--
-- 화면 구성요소:
--   ① 아키타입 이름 + 꾸밈온도 + AI 설명
--   ② 스타일 키워드 태그 (#워크웨어 #캐주얼 ...)
--   ③ 꾸밈 온도 바
--   ④ 컬러 팔레트 (원형 색상 4개)
--   ⑤ 데이트 무드 태그
-- ================================================================

-- ── ① 프로필 헤더: 아키타입 + 온도 + 일관도 + 설명 ──
SELECT u.nickname,
       sa.archetype_name,
       sp.style_temp,
       sp.consistency_kappa,
       sp.description
FROM   style_profiles sp
JOIN   users u             ON sp.user_id = u.user_id
JOIN   style_archetypes sa ON sp.archetype_id = sa.archetype_id
WHERE  sp.user_id = 'uid_001';

-- 결과 예시:
-- | nickname | archetype_name | style_temp | consistency_kappa | description                              |
-- |----------|---------------|------------|-------------------|------------------------------------------|
-- | 하이      | 아메카지 무드    | 70         | 0.92              | 편안한 워크웨어룩에 세련된 시티 감성을 더했어요. |


-- ── ② 아키타입 분포 (V2 ★: 주 아키타입 외 보조 아키타입도 표시) ──
SELECT sa.archetype_name,
       ROUND(pa.weight * 100) AS confidence_pct
FROM   profile_archetypes pa
JOIN   style_archetypes sa ON pa.archetype_id = sa.archetype_id
WHERE  pa.profile_id = 1001
ORDER BY pa.weight DESC;

-- 결과 예시:
-- | archetype_name | confidence_pct |
-- |---------------|----------------|
-- | 아메카지 무드    | 65             |
-- | 모던 클래식     | 20             |
-- | 감성 내추럴     | 15             |


-- ── ③ 스타일 키워드 (#태그 UI용) ──
-- facet과 weight 포함 → UI에서 태그 크기/순서 조절 가능
SELECT k.keyword,
       k.facet,
       pk.weight
FROM   profile_keywords pk
JOIN   style_keywords k ON pk.keyword_id = k.keyword_id
WHERE  pk.profile_id = 1001
ORDER BY pk.weight DESC;

-- 결과 예시:
-- | keyword  | facet | weight |
-- |---------|-------|--------|
-- | 워크웨어 | genre | 0.95   |
-- | 캐주얼   | genre | 0.80   |
-- | 편안함   | vibe  | 0.75   |
-- | 세련됨   | vibe  | 0.70   |
-- | 시티무드 | vibe  | 0.65   |
-- | 레이어드 | fit   | 0.60   |
-- | 셔츠    | item  | 0.55   |
-- | 어스톤   | color | 0.50   |


-- ── ④ 컬러 팔레트 (원형 색상 4개) ──
SELECT hex_code
FROM   profile_colors
WHERE  profile_id = 1001
ORDER BY display_order;

-- 결과 예시:
-- | hex_code |
-- |---------|
-- | #2C3E2D |  ← 카키 다크
-- | #5B7A5E |  ← 올리브 그린
-- | #F5F0EB |  ← 아이보리
-- | #8B4513 |  ← 새들 브라운


-- ── ⑤ 데이트 무드 (태그 UI용) ──
SELECT dm.mood_name, dm.icon
FROM   profile_date_moods pdm
JOIN   date_moods dm ON pdm.mood_id = dm.mood_id
WHERE  pdm.profile_id = 1001;

-- 결과 예시:
-- | mood_name     | icon |
-- |--------------|------|
-- | 감성 카페      | ☕    |
-- | 서점 나들이    | 📚    |
-- | 성수/한남 탐방  | 🚶    |
-- | 와인바        | 🍷    |
-- | 한강 산책      | 🌊    |


-- ================================================================
-- [쿼리 3] 화면 5: 매칭 리스트 — 매칭된 유저 정보 조회 (SELECT)
-- ================================================================
-- 시점: /matches 화면 진입 시, 4축 가중합 스코어링으로 이미 산출된
--       매칭 결과를 기반으로 상대방 정보를 조합하여 카드 UI에 뿌립니다.
--
-- 매칭 엔진 흐름 (앱 레이어):
--   ① Firestore에서 이성 프로필 전체 조회
--   ② 4축 가중합: 아키타입(0.40) + 키워드(0.30) + 온도(0.20) + 컬러(0.10)
--   ③ 일관도 κ 보정: sync_final = 50 + min(κ_나, κ_상대) × (raw - 50)
--   ④ 내림차순 정렬 → 상위 10명 반환
--
-- 아래 쿼리는 매칭 엔진이 선정한 후보들의 상세 정보를 가져옵니다.
-- ================================================================

-- ── 메인 쿼리: 매칭 후보 카드에 필요한 전체 정보 ──
-- 하나의 후보(uid_042)에 대한 전체 정보 조회

-- (A) 후보 기본 정보 + 싱크율 + 4축 상세
SELECT u.nickname                               AS partner_nickname,
       u.age                                     AS partner_age,
       sa.archetype_name                         AS partner_archetype,
       sp.style_temp                             AS partner_temp,
       ul.sync_score,
       JSON_EXTRACT(ul.axis_breakdown, '$.archetype') AS sim_archetype,
       JSON_EXTRACT(ul.axis_breakdown, '$.keyword')   AS sim_keyword,
       JSON_EXTRACT(ul.axis_breakdown, '$.temp')      AS sim_temp,
       JSON_EXTRACT(ul.axis_breakdown, '$.color')     AS sim_color
FROM   user_likes ul
JOIN   users u             ON ul.candidate_user_id = u.user_id
JOIN   style_profiles sp   ON ul.candidate_user_id = sp.user_id
JOIN   style_archetypes sa ON sp.archetype_id = sa.archetype_id
WHERE  ul.user_id = 'uid_001'
  AND  ul.candidate_user_id = 'uid_042';

-- 결과 예시:
-- | partner_nickname | partner_age | partner_archetype | partner_temp | sync_score | sim_archetype | sim_keyword | sim_temp | sim_color |
-- |-----------------|-------------|------------------|-------------|------------|--------------|-------------|----------|-----------|
-- | 수빈             | 24          | 감성 내추럴        | 58          | 73         | 0.7728       | 0.4510      | 0.9400   | 0.8800    |


-- (B) 후보의 스타일 키워드 (태그 표시용)
SELECT k.keyword, k.facet, pk.weight
FROM   profile_keywords pk
JOIN   style_keywords k    ON pk.keyword_id = k.keyword_id
JOIN   style_profiles sp   ON pk.profile_id = sp.profile_id
WHERE  sp.user_id = 'uid_042'
ORDER BY pk.weight DESC;

-- 결과 예시:
-- | keyword  | facet | weight |
-- |---------|-------|--------|
-- | 내추럴   | vibe  | 0.90   |
-- | 캐주얼   | genre | 0.85   |
-- | 편안함   | vibe  | 0.80   |
-- | 어스톤   | color | 0.70   |


-- (C) 후보의 OOTD 이미지 (카드 사진 표시용)
SELECT uo.image_url, oc.name AS category
FROM   user_outfits uo
JOIN   outfit_categories oc ON uo.category_id = oc.category_id
WHERE  uo.user_id = 'uid_042'
ORDER BY oc.display_order;

-- 결과 예시:
-- | image_url                                           | category |
-- |-----------------------------------------------------|---------|
-- | gs://fitting-524/ootd/uid_042/daily/1718345678.jpg  | 데일리룩  |
-- | gs://fitting-524/ootd/uid_042/date/1718345679.jpg   | 데이트룩  |


-- (D) 두 사람의 공통 키워드 (케미 노트 생성용)
SELECT k.keyword, k.facet
FROM   profile_keywords pk_me
JOIN   profile_keywords pk_you
       ON pk_me.keyword_id = pk_you.keyword_id
JOIN   style_keywords k
       ON pk_me.keyword_id = k.keyword_id
JOIN   style_profiles sp_me  ON pk_me.profile_id = sp_me.profile_id
JOIN   style_profiles sp_you ON pk_you.profile_id = sp_you.profile_id
WHERE  sp_me.user_id = 'uid_001'
  AND  sp_you.user_id = 'uid_042';

-- 결과 예시:
-- | keyword | facet |
-- |---------|-------|
-- | 캐주얼  | genre |
-- | 편안함  | vibe  |
-- | 어스톤  | color |
-- → 케미 노트: "둘 다 캐주얼 스타일을 좋아해요!"


-- (E) 두 사람의 공통 데이트 무드 (추천 데이트 코스용)
SELECT dm.mood_name, dm.icon
FROM   profile_date_moods pdm_me
JOIN   profile_date_moods pdm_you
       ON pdm_me.mood_id = pdm_you.mood_id
JOIN   date_moods dm
       ON pdm_me.mood_id = dm.mood_id
JOIN   style_profiles sp_me  ON pdm_me.profile_id = sp_me.profile_id
JOIN   style_profiles sp_you ON pdm_you.profile_id = sp_you.profile_id
WHERE  sp_me.user_id = 'uid_001'
  AND  sp_you.user_id = 'uid_042';

-- 결과 예시:
-- | mood_name     | icon |
-- |--------------|------|
-- | 감성 카페      | ☕   |
-- | 한강 산책      | 🌊   |
-- → 공통 데이트 추천: "감성 카페 데이트 추천"


-- ── 전체 매칭 리스트 조회 (상위 10명, 싱크율 내림차순) ──
-- 앱에서는 이 결과를 스와이프 카드 UI로 표시

SELECT u.nickname,
       u.age,
       sa.archetype_name,
       sp.style_temp,
       ul.sync_score,
       ul.axis_breakdown
FROM   user_likes ul
JOIN   users u             ON ul.candidate_user_id = u.user_id
JOIN   style_profiles sp   ON ul.candidate_user_id = sp.user_id
JOIN   style_archetypes sa ON sp.archetype_id = sa.archetype_id
WHERE  ul.user_id = 'uid_001'
  AND  ul.action = 'LIKE'
ORDER BY ul.sync_score DESC
LIMIT 10;

-- 결과 예시:
-- | nickname | age | archetype_name | style_temp | sync_score | axis_breakdown                                                    |
-- |---------|-----|---------------|------------|------------|-------------------------------------------------------------------|
-- | 수빈     | 24  | 감성 내추럴     | 58         | 73         | {"archetype": 0.77, "keyword": 0.45, "temp": 0.94, "color": 0.88} |
-- | 하은     | 25  | 프렌치 시크     | 72         | 68         | {"archetype": 0.66, "keyword": 0.38, "temp": 0.98, "color": 0.82} |
-- | 예린     | 23  | 빈티지 로맨틱   | 75         | 62         | {"archetype": 0.52, "keyword": 0.41, "temp": 0.95, "color": 0.76} |
-- | ...     | ... | ...           | ...        | ...        | ...                                                               |
