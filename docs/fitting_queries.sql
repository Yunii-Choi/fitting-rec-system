-- ============================================================
-- fitting — 서비스 주요 쿼리문 (발표용)
-- OOTD 스타일 유사도 기반 데이팅 매칭 앱
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. 사용자 등록 및 프로필 조회
-- ────────────────────────────────────────────────────────────

-- 1-1. 신규 사용자 등록
INSERT INTO users (user_id, nickname, gender, age, created_at)
VALUES ('uid_001', '스타일러시_준', 'MALE', 25, NOW());

-- 1-2. 사용자 프로필 조회
SELECT user_id, nickname, gender, age, created_at
FROM   users
WHERE  user_id = 'uid_001';


-- ────────────────────────────────────────────────────────────
-- 2. OOTD 이미지 업로드 및 조회
-- ────────────────────────────────────────────────────────────

-- 2-1. OOTD 사진 업로드 (카테고리별: DAILY / DATE / ME)
INSERT INTO user_outfits (outfit_id, user_id, category_id, image_url, uploaded_at)
VALUES
  (101, 'uid_001', 1, 'gs://fitting-524/ootd/uid_001/daily/img1.jpg', NOW()),
  (102, 'uid_001', 2, 'gs://fitting-524/ootd/uid_001/date/img2.jpg', NOW()),
  (103, 'uid_001', 3, 'gs://fitting-524/ootd/uid_001/me/img3.jpg',   NOW());

-- 2-2. 특정 유저의 OOTD 전체 조회
SELECT uo.outfit_id, oc.name AS category, uo.image_url, uo.uploaded_at
FROM   user_outfits uo
JOIN   outfit_categories oc ON uo.category_id = oc.category_id
WHERE  uo.user_id = 'uid_001'
ORDER BY oc.display_order;


-- ────────────────────────────────────────────────────────────
-- 3. AI 스타일 분석 결과 저장
--    (Gemini LLM 분석 후 구조화된 결과를 DB에 적재)
-- ────────────────────────────────────────────────────────────

-- 3-1. 스타일 프로필 저장
INSERT INTO style_profiles (profile_id, user_id, archetype_id, style_temp, description, generated_at)
VALUES (1001, 'uid_001', 1, 78, '도시적이고 깔끔한 무드의 미니멀 시티보이', NOW());

-- 3-2. 추출된 키워드 저장 (통제 어휘 기반, facet별)
INSERT INTO profile_keywords (profile_id, keyword_id)
SELECT 1001, k.keyword_id
FROM   style_keywords k
WHERE  k.keyword IN ('미니멀', '깔끔', '시티무드', '슬림핏', '무채색');

-- 3-3. 컬러 팔레트 저장
INSERT INTO profile_colors (color_id, profile_id, hex_code, display_order)
VALUES
  (1, 1001, '#1A1A1A', 1),
  (2, 1001, '#4A4A4A', 2),
  (3, 1001, '#D0D0D0', 3),
  (4, 1001, '#F5F0EB', 4);

-- 3-4. 데이트 무드 저장
INSERT INTO profile_date_moods (profile_id, mood_id)
SELECT 1001, dm.mood_id
FROM   date_moods dm
WHERE  dm.mood_name IN ('미술 전시', '루프탑 바', '오마카세', '성수/한남 탐방');


-- ────────────────────────────────────────────────────────────
-- 4. 스타일 프로필 상세 조회 (화면 05: Style Profile)
-- ────────────────────────────────────────────────────────────

-- 4-1. 프로필 + 아키타입 정보
SELECT u.nickname,
       sa.archetype_name,
       sa.gender AS archetype_gender,
       sp.style_temp,
       sp.description
FROM   style_profiles sp
JOIN   users u             ON sp.user_id = u.user_id
JOIN   style_archetypes sa ON sp.archetype_id = sa.archetype_id
WHERE  sp.user_id = 'uid_001';

-- 4-2. 키워드 목록
SELECT k.keyword
FROM   profile_keywords pk
JOIN   style_keywords k ON pk.keyword_id = k.keyword_id
WHERE  pk.profile_id = 1001;

-- 4-3. 컬러 팔레트
SELECT hex_code
FROM   profile_colors
WHERE  profile_id = 1001
ORDER BY display_order;

-- 4-4. 데이트 무드
SELECT dm.mood_name, dm.icon
FROM   profile_date_moods pdm
JOIN   date_moods dm ON pdm.mood_id = dm.mood_id
WHERE  pdm.profile_id = 1001;


-- ────────────────────────────────────────────────────────────
-- 5. 매칭 후보 필터링 (게이트)
--    성별/나이 조건으로 후보 풀 결정
-- ────────────────────────────────────────────────────────────

-- 5-1. 이성 매칭 후보 조회 (나이 ±5세, 이미 like/pass 한 유저 제외)
SELECT sp.user_id,
       u.nickname,
       u.age,
       sa.archetype_name,
       sp.style_temp
FROM   style_profiles sp
JOIN   users u             ON sp.user_id = u.user_id
JOIN   style_archetypes sa ON sp.archetype_id = sa.archetype_id
WHERE  sp.user_id != 'uid_001'                       -- 본인 제외
  AND  u.gender != (SELECT gender FROM users WHERE user_id = 'uid_001')  -- 이성
  AND  u.age BETWEEN 20 AND 30                        -- 나이 필터
  AND  sp.user_id NOT IN (                            -- 이미 평가한 유저 제외
         SELECT candidate_user_id
         FROM   user_likes
         WHERE  user_id = 'uid_001'
       );


-- ────────────────────────────────────────────────────────────
-- 6. 매칭 스코어 계산 (4축 가중합)
--    ① 아키타입 M[i,j]  ② facet 가중 Jaccard
--    ③ 꾸밈온도          ④ CIELAB ΔE
-- ────────────────────────────────────────────────────────────

-- 6-1. 축별 유사도 계산 (SQL 의사코드)
--      실제 앱에서는 클라이언트(TypeScript)에서 계산

-- ① 아키타입 유사도: M 매트릭스 조회
-- → M[my_archetype_id - 1][candidate_archetype_id - 1]
-- 예: 미니멀 시티보이(1) vs 비즈캐주얼 무드(18) → M[0][17] = 0.8525

-- ② 키워드 유사도: facet 가중 Jaccard
WITH my_keywords AS (
    SELECT k.keyword, k.facet, k.canonical
    FROM   profile_keywords pk
    JOIN   style_keywords k ON pk.keyword_id = k.keyword_id
    WHERE  pk.profile_id = 1001   -- 나의 프로필
),
candidate_keywords AS (
    SELECT k.keyword, k.facet, k.canonical
    FROM   profile_keywords pk
    JOIN   style_keywords k ON pk.keyword_id = k.keyword_id
    WHERE  pk.profile_id = 2001   -- 후보 프로필
),
facet_jaccard AS (
    SELECT facet,
           -- |A ∩ B| / |A ∪ B|
           COUNT(CASE WHEN m.canonical IS NOT NULL AND c.canonical IS NOT NULL THEN 1 END) * 1.0
           / NULLIF(COUNT(DISTINCT COALESCE(m.canonical, c.canonical)), 0) AS jaccard
    FROM   my_keywords m
    FULL OUTER JOIN candidate_keywords c
         ON m.facet = c.facet AND m.canonical = c.canonical
    GROUP BY facet
)
SELECT SUM(
         CASE facet
           WHEN 'genre' THEN 0.40
           WHEN 'vibe'  THEN 0.25
           WHEN 'fit'   THEN 0.15
           WHEN 'item'  THEN 0.15
           WHEN 'color' THEN 0.05
         END * jaccard
       ) / SUM(
         CASE facet
           WHEN 'genre' THEN 0.40
           WHEN 'vibe'  THEN 0.25
           WHEN 'fit'   THEN 0.15
           WHEN 'item'  THEN 0.15
           WHEN 'color' THEN 0.05
         END
       ) AS keyword_sim
FROM   facet_jaccard
WHERE  jaccard IS NOT NULL;   -- 양쪽 다 빈 facet은 제외 (재정규화)

-- ③ 꾸밈온도 유사도
-- temp_sim = 1 - ABS(my_temp - candidate_temp) / 100
SELECT 1.0 - ABS(78 - 72) / 100.0 AS temp_sim;   -- 예: 0.94

-- ④ 컬러 유사도 (CIELAB ΔE76)
-- → hex → sRGB → XYZ → Lab 변환 후 평균 Lab 간 유클리드 거리
-- → color_sim = 1 - MIN(ΔE / 100, 1)
-- (Lab 변환은 애플리케이션 레이어에서 수행)

-- 6-2. 최종 싱크율 계산
-- sync_raw  = 100 × Σ(w_k × sim_k) / Σ(active_w_k)
-- sync_final = 50 + min(κ_A, κ_B) × (sync_raw - 50)
-- 예시:
SELECT ROUND(
  50 + 1.0 * (    -- κ = 1.0 (일관도 보정, MVP에서는 1.0 고정)
    100 * (
      0.40 * 0.8525 +   -- ① 아키타입 (시티보이 vs 비즈캐주얼)
      0.30 * 0.3200 +   -- ② 키워드 facet Jaccard
      0.20 * 0.9400 +   -- ③ 꾸밈온도
      0.10 * 0.8800     -- ④ 컬러 CIELAB
    ) - 50
  )
) AS sync_final;   -- → 73%


-- ────────────────────────────────────────────────────────────
-- 7. 좋아요 / 패스 액션 저장
-- ────────────────────────────────────────────────────────────

-- 7-1. 좋아요 저장
INSERT INTO user_likes (like_id, user_id, candidate_user_id, sync_score, action, created_at)
VALUES (5001, 'uid_001', 'uid_042', 73, 'LIKE', NOW());

-- 7-2. 패스 저장
INSERT INTO user_likes (like_id, user_id, candidate_user_id, sync_score, action, created_at)
VALUES (5002, 'uid_001', 'uid_055', 48, 'PASS', NOW());


-- ────────────────────────────────────────────────────────────
-- 8. 상호 매칭 확인 (Mutual Like Detection)
-- ────────────────────────────────────────────────────────────

-- 8-1. 내가 좋아요 한 사람이 나도 좋아요 했는지 확인
SELECT EXISTS (
  SELECT 1
  FROM   user_likes
  WHERE  user_id = 'uid_042'            -- 상대방이
    AND  candidate_user_id = 'uid_001'  -- 나를
    AND  action = 'LIKE'
) AS is_mutual;

-- 8-2. 상호 매칭 성사 시 matches 테이블에 기록
INSERT INTO matches (match_id, user1_id, user2_id, sync_score, matched_at)
SELECT 9001,
       LEAST('uid_001', 'uid_042'),      -- user1_id < user2_id (정규화)
       GREATEST('uid_001', 'uid_042'),
       73,
       NOW()
WHERE EXISTS (
  SELECT 1 FROM user_likes
  WHERE user_id = 'uid_001' AND candidate_user_id = 'uid_042' AND action = 'LIKE'
) AND EXISTS (
  SELECT 1 FROM user_likes
  WHERE user_id = 'uid_042' AND candidate_user_id = 'uid_001' AND action = 'LIKE'
);


-- ────────────────────────────────────────────────────────────
-- 9. 매칭 후 데이트 무드 추천
--    (매칭된 두 사람의 공통 무드 + 아키타입 기반 추천)
-- ────────────────────────────────────────────────────────────

-- 9-1. 두 사람의 공통 데이트 무드
SELECT dm.mood_name, dm.icon, dm.category
FROM   profile_date_moods pdm_a
JOIN   profile_date_moods pdm_b ON pdm_a.mood_id = pdm_b.mood_id
JOIN   date_moods dm            ON pdm_a.mood_id = dm.mood_id
JOIN   style_profiles sp_a      ON pdm_a.profile_id = sp_a.profile_id
JOIN   style_profiles sp_b      ON pdm_b.profile_id = sp_b.profile_id
WHERE  sp_a.user_id = 'uid_001'
  AND  sp_b.user_id = 'uid_042';

-- 9-2. 아키타입 기반 추천 무드 (공통 무드가 부족할 때 보충)
SELECT dm.mood_name, dm.icon
FROM   date_moods dm
WHERE  dm.matching_archetype_1 = (
         SELECT sa.archetype_name
         FROM   style_profiles sp
         JOIN   style_archetypes sa ON sp.archetype_id = sa.archetype_id
         WHERE  sp.user_id = 'uid_001'
       )
   OR  dm.matching_archetype_1 = (
         SELECT sa.archetype_name
         FROM   style_profiles sp
         JOIN   style_archetypes sa ON sp.archetype_id = sa.archetype_id
         WHERE  sp.user_id = 'uid_042'
       )
LIMIT 5;


-- ────────────────────────────────────────────────────────────
-- 10. 통계 / 대시보드 쿼리
-- ────────────────────────────────────────────────────────────

-- 10-1. 아키타입별 사용자 분포
SELECT sa.archetype_name,
       sa.gender,
       COUNT(*) AS user_count
FROM   style_profiles sp
JOIN   style_archetypes sa ON sp.archetype_id = sa.archetype_id
GROUP BY sa.archetype_id, sa.archetype_name, sa.gender
ORDER BY user_count DESC;

-- 10-2. 가장 인기 있는 데이트 무드 TOP 10
SELECT dm.mood_name,
       dm.icon,
       dm.category,
       COUNT(*) AS selected_count
FROM   profile_date_moods pdm
JOIN   date_moods dm ON pdm.mood_id = dm.mood_id
GROUP BY dm.mood_id, dm.mood_name, dm.icon, dm.category
ORDER BY selected_count DESC
LIMIT 10;

-- 10-3. 평균 싱크율 (매칭 성사 기준)
SELECT ROUND(AVG(sync_score), 1) AS avg_sync,
       MIN(sync_score) AS min_sync,
       MAX(sync_score) AS max_sync,
       COUNT(*) AS total_matches
FROM   matches;

-- 10-4. 매칭 전환율 (좋아요 → 상호 매칭)
SELECT
  COUNT(DISTINCT CASE WHEN action = 'LIKE' THEN like_id END) AS total_likes,
  (SELECT COUNT(*) FROM matches) AS total_matches,
  ROUND(
    (SELECT COUNT(*) FROM matches) * 100.0
    / NULLIF(COUNT(DISTINCT CASE WHEN action = 'LIKE' THEN like_id END), 0),
    1
  ) AS conversion_rate_pct
FROM user_likes;
