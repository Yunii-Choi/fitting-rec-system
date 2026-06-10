/**
 * 매칭 엔진 v2 — 4축 가중합 + 일관도 κ 수축
 *
 * similarity.py (feat_jenifer) 로직을 TypeScript로 포팅.
 * 축: ① 아키타입 M조회(0.40) ② facet 가중 Jaccard(0.30) ③ 꾸밈온도(0.20) ④ CIELAB ΔE(0.10)
 * 데이트무드는 스코어에서 제외 → 매칭 후 추천에만 사용.
 */
import type { StyleProfile } from '@/types/style'
import type { Match } from '@/types/match'
import { ARCHETYPES } from '@/lib/masterData'
import { getArchetypeSim } from '@/data/archetypeMatrix'
import { keywordSim } from '@/data/keywordIndex'

// ── 4축 가중치 ──────────────────────────────────────────────────────────

const WEIGHTS = {
  archetype: 0.40,
  keyword: 0.30,
  temp: 0.20,
  color: 0.10,
}

// ── 아키타입 이름 → 숫자 id 매핑 ────────────────────────────────────────

const archetypeNameToId = new Map<string, number>(
  ARCHETYPES.map((a) => [a.name, parseInt(a.id)])
)

function resolveArchetypeId(name: string): number | null {
  return archetypeNameToId.get(name) ?? null
}

// ── ③ 꾸밈온도 유사도 ──────────────────────────────────────────────────

function tempSim(tA: number, tB: number): number {
  return Math.max(0, Math.min(1, 1 - Math.abs(tA - tB) / 100))
}

// ── ④ CIELAB 컬러 유사도 ───────────────────────────────────────────────

function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ]
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function hexToLab(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb01(hex).map(srgbToLinear)

  // sRGB linear → XYZ (D65)
  const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b
  const y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
  const z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b

  // D65 white reference
  const xn = 0.95047, yn = 1.00000, zn = 1.08883
  const delta = 6 / 29
  const f = (t: number) => (t > delta ** 3 ? t ** (1 / 3) : t / (3 * delta ** 2) + 4 / 29)

  const fx = f(x / xn), fy = f(y / yn), fz = f(z / zn)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

function meanLab(palette: string[]): [number, number, number] {
  const labs = palette.map(hexToLab)
  const n = labs.length
  return [
    labs.reduce((s, l) => s + l[0], 0) / n,
    labs.reduce((s, l) => s + l[1], 0) / n,
    labs.reduce((s, l) => s + l[2], 0) / n,
  ]
}

function colorSim(hexA: string[], hexB: string[]): number | null {
  if (hexA.length === 0 || hexB.length === 0) return null
  const [L1, a1, b1] = meanLab(hexA)
  const [L2, a2, b2] = meanLab(hexB)
  const deltaE = Math.sqrt((L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2)
  return 1 - Math.min(deltaE / 100, 1)
}

// ── sync_raw: 4축 가중합 ───────────────────────────────────────────────

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

// ── sync_final: 일관도 κ 수축 ──────────────────────────────────────────

function syncFinal(raw: number, kappaA = 1.0, kappaB = 1.0): number {
  return 50 + Math.min(kappaA, kappaB) * (raw - 50)
}

// ── 후보 프로필 (Firestore + FakeProfile 통합) ─────────────────────────

export interface CandidateProfile {
  id: string
  nickname: string
  age: number
  archetypeId?: number
  archetypeName: string
  archetypeCategory: string
  styleTemp: number
  keywords: string[]
  colorPalette: string[]
  dateMoods: string[]
  outfitUrls: string[]
  description: string
}

// ── 메인 매칭 함수 ─────────────────────────────────────────────────────

export function computeMatchScores(myProfile: StyleProfile, candidates: CandidateProfile[]): Match[] {
  const myArchId = myProfile.archetypeId ?? resolveArchetypeId(myProfile.archetypeName)

  const results: Match[] = candidates.map((c) => {
    const cArchId = c.archetypeId ?? resolveArchetypeId(c.archetypeName)

    // 4축 유사도 계산
    const sims: Record<string, number | null> = {
      archetype: myArchId != null && cArchId != null ? getArchetypeSim(myArchId, cArchId) : null,
      keyword: keywordSim(myProfile.keywords, c.keywords),
      temp: tempSim(myProfile.styleTemp, c.styleTemp),
      color: colorSim(myProfile.colorPalette, c.colorPalette),
    }

    const raw = syncRaw(sims)
    const finalScore = raw != null ? Math.round(syncFinal(raw)) : 0

    // chemistry note 생성
    const sharedKeywords = myProfile.keywords.filter((k) => c.keywords.includes(k))
    const sharedMoods = myProfile.dateMoods.filter((m) => c.dateMoods.includes(m))

    let note = ''
    if (sharedKeywords.length > 0) {
      note += `둘 다 ${sharedKeywords[0]} 스타일을 좋아해요! `
    }
    note += `꾸밈온도 : ${c.styleTemp}℃`
    if (sharedMoods.length > 0) {
      note += ` · ${sharedMoods[0]} 데이트 추천`
    }

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
      chemistryNote: note,
    }
  })

  return results.sort((a, b) => b.syncScore - a.syncScore)
}
