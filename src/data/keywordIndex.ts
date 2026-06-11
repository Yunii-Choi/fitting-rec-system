/**
 * 키워드 통제 어휘 시스템 (5 facet 가중 Jaccard)
 *
 * feat_jenifer의 similarity.py::KeywordIndex + keyword_sim을 TypeScript로 포팅.
 * Draft/keywords.json 기반.
 */

// ── Facet 정의 ──────────────────────────────────────────────────────────

export type Facet = 'genre' | 'vibe' | 'fit' | 'item' | 'color'

export const FACETS: Facet[] = ['genre', 'vibe', 'fit', 'item', 'color']

export const FACET_WEIGHTS: Record<Facet, number> = {
  genre: 0.40,
  vibe: 0.25,
  fit: 0.15,
  item: 0.15,
  color: 0.05,
}

// ── 통제 어휘 (vocabulary) ──────────────────────────────────────────────

export const VOCABULARY: Record<Facet, string[]> = {
  genre: [
    '레트로', '리조트', '미니멀', '베이직', '보헤미안', '비즈캐주얼',
    '스트릿', '스포티', '시크', '아방가르드', '워크웨어', '젠더리스',
    '캐주얼', '클래식', '테크웨어', '페미닌', '포멀', '프레피', '프렌치',
  ],
  vibe: [
    '개성', '깔끔', '내추럴', '따뜻함', '미래적', '부드러움', '세련됨',
    '시티무드', '신뢰감', '에포트리스', '절제', '파워풀', '펀', '편안함',
    '화려함', '활동적',
  ],
  fit: ['레이어드', '슬림핏', '실루엣', '오버핏'],
  item: [
    '그래픽', '니트', '레이스', '믹스매치', '베레모', '셔츠', '숏컷',
    '수트', '스트라이프', '슬랙스', '액세서리', '원피스', '질감', '체크',
    '패턴', '프릴', '플로럴', '하이탑',
  ],
  color: ['뉴트럴', '무채색', '비비드', '어스톤', '쿨톤', '핑크'],
}

// ── 정규화 맵 (raw token → { facet, canonical }) ────────────────────────

interface NormalizeEntry {
  facet: Facet
  canonical: string
}

export const NORMALIZE_MAP: Record<string, NormalizeEntry> = {
  // genre
  '미니멀': { facet: 'genre', canonical: '미니멀' },
  '클래식': { facet: 'genre', canonical: '클래식' },
  '캐주얼': { facet: 'genre', canonical: '캐주얼' },
  '모던캐주얼': { facet: 'genre', canonical: '캐주얼' },
  '스트릿': { facet: 'genre', canonical: '스트릿' },
  '럭셔리스트릿': { facet: 'genre', canonical: '스트릿' },
  '그런지': { facet: 'genre', canonical: '스트릿' },
  '스케이트': { facet: 'genre', canonical: '스트릿' },
  '스포츠믹스': { facet: 'genre', canonical: '스포티' },
  '테크웨어': { facet: 'genre', canonical: '테크웨어' },
  '기능성': { facet: 'genre', canonical: '테크웨어' },
  '포멀': { facet: 'genre', canonical: '포멀' },
  '정장감': { facet: 'genre', canonical: '포멀' },
  '비즈캐주얼': { facet: 'genre', canonical: '비즈캐주얼' },
  '오피스룩': { facet: 'genre', canonical: '비즈캐주얼' },
  '페미닌': { facet: 'genre', canonical: '페미닌' },
  '여성스러움': { facet: 'genre', canonical: '페미닌' },
  '레트로': { facet: 'genre', canonical: '레트로' },
  '빈티지': { facet: 'genre', canonical: '레트로' },
  '올드스쿨': { facet: 'genre', canonical: '레트로' },
  '보헤미안': { facet: 'genre', canonical: '보헤미안' },
  '프레피': { facet: 'genre', canonical: '프레피' },
  '캠퍼스': { facet: 'genre', canonical: '프레피' },
  '프렌치': { facet: 'genre', canonical: '프렌치' },
  '아방가르드': { facet: 'genre', canonical: '아방가르드' },
  '실험적': { facet: 'genre', canonical: '아방가르드' },
  '워크웨어': { facet: 'genre', canonical: '워크웨어' },
  '리조트': { facet: 'genre', canonical: '리조트' },
  '서핑': { facet: 'genre', canonical: '리조트' },
  '썸머바이브': { facet: 'genre', canonical: '리조트' },
  '젠더리스': { facet: 'genre', canonical: '젠더리스' },
  '베이직': { facet: 'genre', canonical: '베이직' },
  '무난': { facet: 'genre', canonical: '베이직' },
  '데일리': { facet: 'genre', canonical: '베이직' },
  '시크': { facet: 'genre', canonical: '시크' },
  '걸크러시': { facet: 'genre', canonical: '시크' },
  // vibe
  '깔끔': { facet: 'vibe', canonical: '깔끔' },
  '심플': { facet: 'vibe', canonical: '깔끔' },
  '단정함': { facet: 'vibe', canonical: '깔끔' },
  '절제': { facet: 'vibe', canonical: '절제' },
  '절제미': { facet: 'vibe', canonical: '절제' },
  '부드러움': { facet: 'vibe', canonical: '부드러움' },
  '따뜻함': { facet: 'vibe', canonical: '따뜻함' },
  '편안함': { facet: 'vibe', canonical: '편안함' },
  '여유로움': { facet: 'vibe', canonical: '편안함' },
  '자유로움': { facet: 'vibe', canonical: '편안함' },
  '라운지': { facet: 'vibe', canonical: '편안함' },
  '내추럴': { facet: 'vibe', canonical: '내추럴' },
  '자연스러움': { facet: 'vibe', canonical: '내추럴' },
  '오가닉': { facet: 'vibe', canonical: '내추럴' },
  '차분함': { facet: 'vibe', canonical: '내추럴' },
  '활동적': { facet: 'vibe', canonical: '활동적' },
  '에너지': { facet: 'vibe', canonical: '활동적' },
  '화려함': { facet: 'vibe', canonical: '화려함' },
  '대담': { facet: 'vibe', canonical: '화려함' },
  '볼드': { facet: 'vibe', canonical: '화려함' },
  '세련됨': { facet: 'vibe', canonical: '세련됨' },
  '모던': { facet: 'vibe', canonical: '세련됨' },
  '트렌드': { facet: 'vibe', canonical: '세련됨' },
  '개성': { facet: 'vibe', canonical: '개성' },
  '에포트리스': { facet: 'vibe', canonical: '에포트리스' },
  '미래적': { facet: 'vibe', canonical: '미래적' },
  '신뢰감': { facet: 'vibe', canonical: '신뢰감' },
  '파워풀': { facet: 'vibe', canonical: '파워풀' },
  '펀': { facet: 'vibe', canonical: '펀' },
  '시티무드': { facet: 'vibe', canonical: '시티무드' },
  // fit
  '오버핏': { facet: 'fit', canonical: '오버핏' },
  '루즈핏': { facet: 'fit', canonical: '오버핏' },
  '슬림핏': { facet: 'fit', canonical: '슬림핏' },
  '레이어드': { facet: 'fit', canonical: '레이어드' },
  '실루엣': { facet: 'fit', canonical: '실루엣' },
  // item
  '니트': { facet: 'item', canonical: '니트' },
  '니트조끼': { facet: 'item', canonical: '니트' },
  '셔츠': { facet: 'item', canonical: '셔츠' },
  '슬랙스': { facet: 'item', canonical: '슬랙스' },
  '수트': { facet: 'item', canonical: '수트' },
  '원피스': { facet: 'item', canonical: '원피스' },
  '체크': { facet: 'item', canonical: '체크' },
  '스트라이프': { facet: 'item', canonical: '스트라이프' },
  '플로럴': { facet: 'item', canonical: '플로럴' },
  '레이스': { facet: 'item', canonical: '레이스' },
  '프릴': { facet: 'item', canonical: '프릴' },
  '그래픽': { facet: 'item', canonical: '그래픽' },
  '로고': { facet: 'item', canonical: '그래픽' },
  '하이탑': { facet: 'item', canonical: '하이탑' },
  '베레모': { facet: 'item', canonical: '베레모' },
  '패턴': { facet: 'item', canonical: '패턴' },
  '패턴믹스': { facet: 'item', canonical: '패턴' },
  '믹스매치': { facet: 'item', canonical: '믹스매치' },
  '브랜드믹스': { facet: 'item', canonical: '믹스매치' },
  '악세서리': { facet: 'item', canonical: '액세서리' },
  '액세서리': { facet: 'item', canonical: '액세서리' },
  '질감': { facet: 'item', canonical: '질감' },
  '숏컷': { facet: 'item', canonical: '숏컷' },
  // color
  '무채색': { facet: 'color', canonical: '무채색' },
  '모노톤': { facet: 'color', canonical: '무채색' },
  '블랙&화이트': { facet: 'color', canonical: '무채색' },
  '블랙': { facet: 'color', canonical: '무채색' },
  '올블랙': { facet: 'color', canonical: '무채색' },
  '비비드': { facet: 'color', canonical: '비비드' },
  '컬러풀': { facet: 'color', canonical: '비비드' },
  '컬러': { facet: 'color', canonical: '비비드' },
  '컬러블록': { facet: 'color', canonical: '비비드' },
  '볼드컬러': { facet: 'color', canonical: '비비드' },
  '어스톤': { facet: 'color', canonical: '어스톤' },
  '블루그레이': { facet: 'color', canonical: '쿨톤' },
  '차가운톤': { facet: 'color', canonical: '쿨톤' },
  '핑크': { facet: 'color', canonical: '핑크' },
  '뉴트럴': { facet: 'color', canonical: '뉴트럴' },
}

// ── 정규화 함수 ─────────────────────────────────────────────────────────

/**
 * raw 키워드 배열 → facet별 canonical 셋으로 정규화
 * 알 수 없는 토큰은 drop (설계 결정 A: warn+drop)
 */
export function normalizeKeywords(rawTokens: string[]): Record<Facet, Set<string>> {
  const result: Record<Facet, Set<string>> = {
    genre: new Set(),
    vibe: new Set(),
    fit: new Set(),
    item: new Set(),
    color: new Set(),
  }
  for (const tok of rawTokens) {
    const entry = NORMALIZE_MAP[tok]
    if (!entry) {
      console.warn(`[keywordIndex] unknown token dropped: "${tok}"`)
      continue
    }
    result[entry.facet].add(entry.canonical)
  }
  return result
}

// ── Facet 가중 Jaccard ──────────────────────────────────────────────────

/**
 * 두 유저의 키워드 간 facet 가중 Jaccard 유사도
 *
 * - 양쪽 다 빈 facet → 비활성 (재정규화에서 제외)
 * - 한쪽만 빈 facet → 활성, Jaccard 0 (정보 격차 페널티)
 * - 모든 facet 비활성 → null 반환 (sync_raw에서 축 제외)
 *
 * @returns 0~1 또는 null
 */
export function keywordSim(rawA: string[], rawB: string[]): number | null {
  const normA = normalizeKeywords(rawA)
  const normB = normalizeKeywords(rawB)

  let weightedSum = 0
  let activeWeight = 0

  for (const facet of FACETS) {
    const setA = normA[facet]
    const setB = normB[facet]

    if (setA.size === 0 && setB.size === 0) continue // 양쪽 빔 → 비활성

    const union = new Set([...setA, ...setB])
    const intersection = [...setA].filter((x) => setB.has(x)).length
    const jaccard = union.size === 0 ? 0 : intersection / union.size

    const w = FACET_WEIGHTS[facet]
    weightedSum += w * jaccard
    activeWeight += w
  }

  if (activeWeight === 0) return null
  return weightedSum / activeWeight
}

// ── V2: 가중 Jaccard (KeywordEntry 기반) ────────────────────────────────

import type { KeywordEntry } from '@/types/style'

/**
 * KeywordEntry[] 기반 가중 Jaccard.
 * facet별로 canonical → weight 맵을 만들고, min/max 가중 Jaccard 산출.
 * entries가 비어있으면 기존 set Jaccard로 fallback.
 */
export function keywordSimWeighted(
  entriesA: KeywordEntry[] | undefined,
  entriesB: KeywordEntry[] | undefined,
  rawA: string[],
  rawB: string[],
): number | null {
  // entries 없으면 기존 set Jaccard fallback
  if (!entriesA?.length || !entriesB?.length) {
    return keywordSim(rawA, rawB)
  }

  // facet별 canonical → weight 맵 구축
  const buildFacetMap = (entries: KeywordEntry[]) => {
    const m: Record<Facet, Map<string, number>> = {
      genre: new Map(), vibe: new Map(), fit: new Map(), item: new Map(), color: new Map(),
    }
    for (const e of entries) {
      const norm = NORMALIZE_MAP[e.keyword]
      if (!norm) continue
      const facet = norm.facet as Facet
      const canonical = norm.canonical
      const existing = m[facet].get(canonical) ?? 0
      m[facet].set(canonical, Math.max(existing, e.weight))
    }
    return m
  }

  const mapA = buildFacetMap(entriesA)
  const mapB = buildFacetMap(entriesB)

  let weightedSum = 0
  let activeWeight = 0

  for (const facet of FACETS) {
    const fA = mapA[facet]
    const fB = mapB[facet]

    if (fA.size === 0 && fB.size === 0) continue

    // 가중 Jaccard: Σ min(wA, wB) / Σ max(wA, wB)
    const allKeys = new Set([...fA.keys(), ...fB.keys()])
    let sumMin = 0
    let sumMax = 0
    for (const key of allKeys) {
      const wA = fA.get(key) ?? 0
      const wB = fB.get(key) ?? 0
      sumMin += Math.min(wA, wB)
      sumMax += Math.max(wA, wB)
    }
    const jaccard = sumMax === 0 ? 0 : sumMin / sumMax

    const fw = FACET_WEIGHTS[facet]
    weightedSum += fw * jaccard
    activeWeight += fw
  }

  if (activeWeight === 0) return null
  return weightedSum / activeWeight
}
