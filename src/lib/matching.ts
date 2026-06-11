/**
 * 매칭 엔진 V2 — 4축 가중합 + 아키타입 분포 + 일관도 κ 수축
 *
 * V2 변경:
 * - 아키타입: 단일 id → 분포 모드 (pᵀMq) 지원
 * - 키워드: 가중 Jaccard 지원 (keywordEntries)
 * - 일관도: 실제 κ 값 적용
 * - axisBreakdown 반환
 */
import type { StyleProfile, ArchetypeWeight, KeywordEntry } from '@/types/style'
import type { Match, AxisBreakdown } from '@/types/match'
import { ARCHETYPES } from '@/lib/masterData'
import { getArchetypeSim, getArchetypeDistSim } from '@/data/archetypeMatrix'
import { keywordSim } from '@/data/keywordIndex'

// ── 4축 가중치 ──────────────────────────────────────────────────────────

const WEIGHTS = {
  archetype: 0.40,
  keyword: 0.30,
  temp: 0.20,
  color: 0.10,
}

// ── 아키타입 이름 → 숫자 id ─────────────────────────────────────────────

const archetypeNameToId = new Map<string, number>(
  ARCHETYPES.map((a) => [a.name, parseInt(a.id)])
)

function resolveArchetypeId(name: string): number | null {
  return archetypeNameToId.get(name) ?? null
}

// ── 아키타입 분포 → 30차원 벡터 ─────────────────────────────────────────

function toDistVector(dist: ArchetypeWeight[] | undefined, fallbackId: number | null): number[] | null {
  if (dist && dist.length > 1) {
    const vec = new Array(30).fill(0)
    for (const d of dist) {
      if (d.archetypeId >= 1 && d.archetypeId <= 30) {
        vec[d.archetypeId - 1] = d.weight
      }
    }
    return vec
  }
  return null // 단일 라벨 모드 사용
}

// ── ① 아키타입 유사도 (분포/단일 자동 분기) ────────────────────────────

function archetypeSim(
  idA: number | null, distA: ArchetypeWeight[] | undefined,
  idB: number | null, distB: ArchetypeWeight[] | undefined,
): number | null {
  const vecA = toDistVector(distA, idA)
  const vecB = toDistVector(distB, idB)

  // 둘 다 분포 → pᵀMq
  if (vecA && vecB) return getArchetypeDistSim(vecA, vecB)
  // 둘 다 단일 → M[i][j]
  if (idA != null && idB != null) return getArchetypeSim(idA, idB)
  // 한쪽만 분포 → 단일 쪽을 원핫으로 확장
  if (vecA && idB != null) {
    const vecB1 = new Array(30).fill(0); vecB1[idB - 1] = 1.0
    return getArchetypeDistSim(vecA, vecB1)
  }
  if (idA != null && vecB) {
    const vecA1 = new Array(30).fill(0); vecA1[idA - 1] = 1.0
    return getArchetypeDistSim(vecA1, vecB)
  }
  return null
}

// ── ③ 꾸밈온도 유사도 ──────────────────────────────────────────────────

function tempSim(tA: number, tB: number): number {
  return Math.max(0, Math.min(1, 1 - Math.abs(tA - tB) / 100))
}

// ── ④ CIELAB 컬러 유사도 ───────────────────────────────────────────────

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function hexToLab(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => srgbToLinear(parseInt(h.substring(i, i + 2), 16) / 255))

  const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b
  const y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
  const z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b

  const delta = 6 / 29
  const f = (t: number) => (t > delta ** 3 ? t ** (1 / 3) : t / (3 * delta ** 2) + 4 / 29)

  const fx = f(x / 0.95047), fy = f(y / 1.0), fz = f(z / 1.08883)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

function colorSim(hexA: string[], hexB: string[]): number | null {
  if (hexA.length === 0 || hexB.length === 0) return null
  const mean = (p: string[]) => {
    const labs = p.map(hexToLab)
    const n = labs.length
    return [0, 1, 2].map((i) => labs.reduce((s, l) => s + l[i], 0) / n) as [number, number, number]
  }
  const [L1, a1, b1] = mean(hexA)
  const [L2, a2, b2] = mean(hexB)
  const deltaE = Math.sqrt((L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2)
  return 1 - Math.min(deltaE / 100, 1)
}

// ── sync 계산 ──────────────────────────────────────────────────────────

function syncRaw(sims: Record<string, number | null>): number | null {
  let weightedSum = 0
  let activeWeight = 0
  for (const [axis, w] of Object.entries(WEIGHTS)) {
    const sim = sims[axis]
    if (sim == null) continue
    weightedSum += w * sim
    activeWeight += w
  }
  if (activeWeight === 0) return null
  return 100 * weightedSum / activeWeight
}

function syncFinal(raw: number, kappaA: number, kappaB: number): number {
  return 50 + Math.min(kappaA, kappaB) * (raw - 50)
}

// ── 후보 프로필 (V2) ───────────────────────────────────────────────────

export interface CandidateProfile {
  id: string
  nickname: string
  age: number
  archetypeId?: number
  archetypeName: string
  archetypeCategory: string
  archetypeDistribution?: ArchetypeWeight[]
  styleTemp: number
  consistencyKappa?: number
  keywords: string[]
  keywordEntries?: KeywordEntry[]
  colorPalette: string[]
  dateMoods: string[]
  outfitUrls: string[]
  description: string
}

// ── 메인 매칭 함수 (V2) ────────────────────────────────────────────────

export function computeMatchScores(myProfile: StyleProfile, candidates: CandidateProfile[]): Match[] {
  const myArchId = myProfile.archetypeId ?? resolveArchetypeId(myProfile.archetypeName)
  const myKappa = myProfile.consistencyKappa ?? 1.0

  const results: Match[] = candidates.map((c) => {
    const cArchId = c.archetypeId ?? resolveArchetypeId(c.archetypeName)
    const cKappa = c.consistencyKappa ?? 1.0

    // 4축 유사도
    const sims: Record<string, number | null> = {
      archetype: archetypeSim(myArchId, myProfile.archetypeDistribution, cArchId, c.archetypeDistribution),
      keyword: keywordSim(myProfile.keywords, c.keywords),
      temp: tempSim(myProfile.styleTemp, c.styleTemp),
      color: colorSim(myProfile.colorPalette, c.colorPalette),
    }

    const raw = syncRaw(sims)
    const finalScore = raw != null ? Math.round(syncFinal(raw, myKappa, cKappa)) : 0

    const axisBreakdown: AxisBreakdown = {
      archetype: sims.archetype,
      keyword: sims.keyword,
      temp: sims.temp,
      color: sims.color,
    }

    // chemistry note
    const sharedKeywords = myProfile.keywords.filter((k) => c.keywords.includes(k))
    const sharedMoods = myProfile.dateMoods.filter((m) => c.dateMoods.includes(m))

    let note = ''
    if (sharedKeywords.length > 0) note += `둘 다 ${sharedKeywords[0]} 스타일을 좋아해요! `
    note += `꾸밈온도 : ${c.styleTemp}℃`
    if (sharedMoods.length > 0) note += ` · ${sharedMoods[0]} 데이트 추천`

    return {
      matchId: c.id,
      partnerId: c.id,
      partnerNickname: c.nickname,
      partnerAge: c.age,
      partnerArchetype: c.archetypeName,
      partnerKeywords: c.keywords,
      partnerColorPalette: c.colorPalette,
      partnerDateMoods: c.dateMoods,
      partnerOutfitUrls: c.outfitUrls,
      syncScore: finalScore,
      axisBreakdown,
      chemistryNote: note,
    }
  })

  return results.sort((a, b) => b.syncScore - a.syncScore)
}
