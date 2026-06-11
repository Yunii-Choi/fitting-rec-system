-- ============================================================
-- fitting — 서비스 주요 쿼리문 (ERD V2 기준)
-- OOTD 스타일 유사도 기반 데이팅 매칭 앱
-- 14 tables · v2 (아키타입 분포, 키워드 가중치, 일관도 κ, axis_breakdown)
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. 사용자 등록 및 프로필 조회
-- ────────────────────────────────────────────────────────────

-- 1-1. 신규 사용자 등록
INSERT INTO users (user_id, nickname, gender, age, created_at)
VALUES ('uid_001', '하이', 'MALE', 25, NOW());

-- 1-2. 사용자 프로필 조회
SELECT user_id, nickname, gender, age, created_at
FROM   users
WHERE  user_id = 'uid_001';


-- ────────────────────────────────────────────────────────────
-- 2. OOTD 이미지 업로드
-- ────────────────────────────────────────────────────────────

-- 2-1. OOTD 사진 업로드 (카테고리별)
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
-- 3. AI 스타일 분석 결과 저장 (Gemini → DB)
--    V2: 아키타입 분포 + 키워드 가중치 + 일관도 κ
-- ────────────────────────────────────────────────────────────

-- 3-1. 스타일 프로필 저장 (V2: consistency_kappa 추가)
INSERT INTO style_profiles
  (profile_id, user_id, archetype_id, style_temp, consistency_kappa, description, generated_at)
VALUES
  (1001, 'uid_001', 29, 70, 0.92,
   '편안한 워크웨어룩에 세련된 시티 감성을 더했어요.', NOW());

-- 3-2. 아키타입 분포 저장 (V2 신규: profile_archetypes ★)
INSERT INTO profile_archetypes (profile_id, archetype_id, weight)
VALUES
  (1001, 29, 0.65),   -- 아메카지 무드 (주 아키타입)
  (1001, 15, 0.20),   -- 모던 클래식 (보조)
  (1001, 20, 0.15);   -- 감성 내추럴 (보조)

-- 3-3. 키워드 저장 (V2: weight 추가 ★)
INSERT INTO profile_keywords (profile_id, keyword_id, weight)
SELECT 1001, k.keyword_id,
       CASE k.keyword
         WHEN '워크웨어' THEN 0.95
         WHEN '캐주얼'   THEN 0.80
         WHEN '편안함'   THEN 0.75
         WHEN '세련됨'   THEN 0.70
         WHEN '시티무드'  THEN 0.65
         WHEN '레이어드'  THEN 0.60
         WHEN '셔츠'     THEN 0.55
         WHEN '어스톤'   THEN 0.50
       END
FROM   style_keywords k
WHERE  k.keyword IN ('워크웨어', '캐주얼', '편안함', '세련됨', '시티무드', '레이어드', '셔츠', '어스톤');

-- 3-4. 컬러 팔레트 저장
INSERT INTO profile_colors (color_id, profile_id, hex_code, display_order)
VALUES
  (1, 1001, '#2C3E2D', 1),
  (2, 1001, '#5B7A5E', 2),
  (3, 1001, '#F5F0EB', 3),
  (4, 1001, '#8B4513', 4);

-- 3-5. 데이트 무드 저장
INSERT INTO profile_date_moods (profile_id, mood_id)
SELECT 1001, dm.mood_id
FROM   date_moods dm
WHERE  dm.mood_name IN ('감성 카페', '서점 나들이', '성수/한남 탐방', '와인바', '한강 산책');


-- ────────────────────────────────────────────────────────────
-- 4. 스타일 프로필 상세 조회 (화면 04: Style Profile)
-- ────────────────────────────────────────────────────────────

-- 4-1. 프로필 기본 + 아키타입 정보 + κ
SELECT u.nickname,
       sa.archetype_name,
       sa.gender AS archetype_gender,
       sp.style_temp,
       sp.consistency_kappa,
       sp.description
FROM   style_profiles sp
JOIN   users u             ON sp.user_id = u.user_id
JOIN   style_archetypes sa ON sp.archetype_id = sa.archetype_id
WHERE  sp.user_id = 'uid_001';

-- 4-2. 아키타입 분포 (V2 ★)
SELECT sa.archetype_name, sa.gender, pa.weight
FROM   profile_archetypes pa
JOIN   style_archetypes sa ON pa.archetype_id = sa.archetype_id
WHERE  pa.profile_id = 1001
ORDER BY pa.weight DESC;

-- 4-3. 키워드 + facet + weight (V2 ★)
SELECT k.keyword, k.facet, pk.weight
FROM   profile_keywords pk
JOIN   style_keywords k ON pk.keyword_id = k.keyword_id
WHERE  pk.profile_id = 1001
ORDER BY pk.weight DESC;

-- 4-4. 컬러 팔레트
SELECT hex_code
FROM   profile_colors
WHERE  profile_id = 1001
ORDER BY display_order;

-- 4-5. 데이트 무드
SELECT dm.mood_name, dm.icon
FROM   profile_date_moods pdm
JOIN   date_moods dm ON pdm.mood_id = dm.mood_id
WHERE  pdm.profile_id = 1001;


-- ────────────────────────────────────────────────────────────
-- 5. 매칭 후보 필터링 (게이트: 이성 + 나이 + 기평가 제외)
-- ────────────────────────────────────────────────────────────

SELECT sp.user_id,
       u.nickname,
       u.age,
       sa.archetype_name,
       sp.style_temp,
       sp.consistency_kappa
FROM   style_profiles sp
JOIN   users u             ON sp.user_id = u.user_id
JOIN   style_archetypes sa ON sp.archetype_id = sa.archetype_id
WHERE  sp.user_id != 'uid_001'
  AND  u.gender != (SELECT gender FROM users WHERE user_id = 'uid_001')
  AND  u.age BETWEEN 20 AND 30
  AND  sp.user_id NOT IN (
         SELECT candidate_user_id
         FROM   user_likes
         WHERE  user_id = 'uid_001'
       );


-- ────────────────────────────────────────────────────────────
-- 6. 매칭 스코어 계산 (4축 가중합, V2)
-- ────────────────────────────────────────────────────────────

-- ① 아키타입 유사도 (V2: 분포 모드 pᵀMq)
-- 분포 벡터끼리 M 매트릭스를 통해 유사도 산출
SELECT SUM(pa_me.weight * ad.dist * pa_you.weight) AS archetype_sim
FROM   profile_archetypes pa_me
JOIN   archetype_distances ad
       ON pa_me.archetype_id = ad.a_id
JOIN   profile_archetypes pa_you
       ON ad.b_id = pa_you.archetype_id
WHERE  pa_me.profile_id = 1001    -- 나
  AND  pa_you.profile_id = 2001;  -- 후보

-- ② 키워드 유사도 (V2: facet 가중 Jaccard)
WITH my_kw AS (
    SELECT k.facet, k.keyword AS canonical
    FROM   profile_keywords pk
    JOIN   style_keywords k ON pk.keyword_id = k.keyword_id
    WHERE  pk.profile_id = 1001
),
cand_kw AS (
    SELECT k.facet, k.keyword AS canonical
    FROM   profile_keywords pk
    JOIN   style_keywords k ON pk.keyword_id = k.keyword_id
    WHERE  pk.profile_id = 2001
),
facet_sim AS (
    SELECT facet,
           COUNT(CASE WHEN m.canonical IS NOT NULL AND c.canonical IS NOT NULL THEN 1 END) * 1.0
           / NULLIF(COUNT(DISTINCT COALESCE(m.canonical, c.canonical)), 0) AS jaccard
    FROM   my_kw m
    FULL OUTER JOIN cand_kw c ON m.facet = c.facet AND m.canonical = c.canonical
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
FROM   facet_sim
WHERE  jaccard IS NOT NULL;

-- ③ 꾸밈온도 유사도
SELECT 1.0 - ABS(
  (SELECT style_temp FROM style_profiles WHERE profile_id = 1001)
  - (SELECT style_temp FROM style_profiles WHERE profile_id = 2001)
) / 100.0 AS temp_sim;

-- ④ 컬러 유사도 (CIELAB ΔE — 앱 레이어에서 수행, SQL은 의사코드)
-- color_sim = 1 - MIN(ΔE_Lab / 100, 1)

-- 최종 싱크율 계산 (예시 수치)
SELECT ROUND(
  50 + LEAST(0.92, 0.88) * (   -- min(κ_나, κ_후보) × (raw - 50)
    100 * (
      0.40 * 0.7728 +   -- ① 아키타입 분포 유사도 (pᵀMq)
      0.30 * 0.4510 +   -- ② facet 가중 Jaccard
      0.20 * 0.9400 +   -- ③ 꾸밈온도
      0.10 * 0.8800     -- ④ CIELAB ΔE
    ) - 50
  )
) AS sync_final;


-- ────────────────────────────────────────────────────────────
-- 7. 좋아요 / 패스 (V2: axis_breakdown 포함 ★)
-- ────────────────────────────────────────────────────────────

-- 7-1. 좋아요 (4축 상세 저장)
INSERT INTO user_likes
  (like_id, user_id, candidate_user_id, sync_score, axis_breakdown, action, created_at)
VALUES
  (5001, 'uid_001', 'uid_042', 73,
   '{"archetype": 0.7728, "keyword": 0.4510, "temp": 0.9400, "color": 0.8800}',
   'LIKE', NOW());

-- 7-2. 패스 (4축 상세 저장)
INSERT INTO user_likes
  (like_id, user_id, candidate_user_id, sync_score, axis_breakdown, action, created_at)
VALUES
  (5002, 'uid_001', 'uid_055', 48,
   '{"archetype": 0.3200, "keyword": 0.1200, "temp": 0.8500, "color": 0.9100}',
   'PASS', NOW());


-- ────────────────────────────────────────────────────────────
-- 8. 상호 매칭 확인 + 매칭 기록 (V2: axis_breakdown ★)
-- ────────────────────────────────────────────────────────────

-- 8-1. 상호 좋아요 확인
SELECT EXISTS (
  SELECT 1
  FROM   user_likes
  WHERE  user_id = 'uid_042'
    AND  candidate_user_id = 'uid_001'
    AND  action = 'LIKE'
) AS is_mutual;

-- 8-2. 상호 매칭 성사 시 matches에 기록
INSERT INTO matches (match_id, user1_id, user2_id, sync_score, axis_breakdown, matched_at)
SELECT 9001,
       LEAST('uid_001', 'uid_042'),
       GREATEST('uid_001', 'uid_042'),
       73,
       '{"archetype": 0.7728, "keyword": 0.4510, "temp": 0.9400, "color": 0.8800}',
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
-- ────────────────────────────────────────────────────────────

-- 두 사람의 공통 데이트 무드
SELECT dm.mood_name, dm.icon, dm.category
FROM   profile_date_moods pdm_a
JOIN   profile_date_moods pdm_b ON pdm_a.mood_id = pdm_b.mood_id
JOIN   date_moods dm            ON pdm_a.mood_id = dm.mood_id
JOIN   style_profiles sp_a      ON pdm_a.profile_id = sp_a.profile_id
JOIN   style_profiles sp_b      ON pdm_b.profile_id = sp_b.profile_id
WHERE  sp_a.user_id = 'uid_001'
  AND  sp_b.user_id = 'uid_042';


-- ────────────────────────────────────────────────────────────
-- 10. M 거리표 조회 (V2 신규: archetype_distances ★)
-- ────────────────────────────────────────────────────────────

-- 10-1. 특정 아키타입 페어 거리
SELECT sa_a.archetype_name AS archetype_a,
       sa_b.archetype_name AS archetype_b,
       ad.dist
FROM   archetype_distances ad
JOIN   style_archetypes sa_a ON ad.a_id = sa_a.archetype_id
JOIN   style_archetypes sa_b ON ad.b_id = sa_b.archetype_id
WHERE  ad.a_id = 29 AND ad.b_id = 15;

-- 10-2. 특정 아키타입의 최근접 top-5
SELECT sa_b.archetype_name, ad.dist
FROM   archetype_distances ad
JOIN   style_archetypes sa_b ON ad.b_id = sa_b.archetype_id
WHERE  ad.a_id = 29
  AND  ad.a_id != ad.b_id
ORDER BY ad.dist DESC
LIMIT 5;


-- ────────────────────────────────────────────────────────────
-- 11. 통계 / 대시보드
-- ────────────────────────────────────────────────────────────

-- 11-1. 아키타입별 사용자 분포
SELECT sa.archetype_name, sa.gender, COUNT(*) AS user_count
FROM   style_profiles sp
JOIN   style_archetypes sa ON sp.archetype_id = sa.archetype_id
GROUP BY sa.archetype_id, sa.archetype_name, sa.gender
ORDER BY user_count DESC;

-- 11-2. 인기 데이트 무드 TOP 10
SELECT dm.mood_name, dm.icon, dm.category, COUNT(*) AS cnt
FROM   profile_date_moods pdm
JOIN   date_moods dm ON pdm.mood_id = dm.mood_id
GROUP BY dm.mood_id, dm.mood_name, dm.icon, dm.category
ORDER BY cnt DESC
LIMIT 10;

-- 11-3. facet별 키워드 사용 빈도
SELECT k.facet, k.keyword, COUNT(*) AS cnt, ROUND(AVG(pk.weight), 2) AS avg_weight
FROM   profile_keywords pk
JOIN   style_keywords k ON pk.keyword_id = k.keyword_id
GROUP BY k.facet, k.keyword
ORDER BY k.facet, cnt DESC;

-- 11-4. 평균 싱크율 + 일관도
SELECT ROUND(AVG(sync_score), 1)    AS avg_sync,
       MIN(sync_score)               AS min_sync,
       MAX(sync_score)               AS max_sync,
       COUNT(*)                      AS total_matches
FROM   matches;

-- 11-5. 매칭 전환율
SELECT
  COUNT(DISTINCT CASE WHEN action = 'LIKE' THEN like_id END) AS total_likes,
  (SELECT COUNT(*) FROM matches) AS total_matches,
  ROUND(
    (SELECT COUNT(*) FROM matches) * 100.0
    / NULLIF(COUNT(DISTINCT CASE WHEN action = 'LIKE' THEN like_id END), 0),
    1
  ) AS conversion_rate_pct
FROM user_likes;

-- 11-6. 축별 평균 기여도 (V2 ★)
SELECT ROUND(AVG(CAST(JSON_EXTRACT(axis_breakdown, '$.archetype') AS FLOAT)), 3) AS avg_archetype,
       ROUND(AVG(CAST(JSON_EXTRACT(axis_breakdown, '$.keyword')   AS FLOAT)), 3) AS avg_keyword,
       ROUND(AVG(CAST(JSON_EXTRACT(axis_breakdown, '$.temp')      AS FLOAT)), 3) AS avg_temp,
       ROUND(AVG(CAST(JSON_EXTRACT(axis_breakdown, '$.color')     AS FLOAT)), 3) AS avg_color
FROM   user_likes
WHERE  action = 'LIKE';
