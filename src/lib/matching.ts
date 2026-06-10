import type { StyleProfile } from '@/types/style'
import type { Match } from '@/types/match'

interface FakeProfile {
  id: string
  nickname: string
  age: number
  archetypeName: string
  archetypeCategory: string
  styleTemp: number
  keywords: string[]
  colorPalette: string[]
  dateMoods: string[]
  outfitUrls: string[]
  description: string
}

// Jaccard similarity between two sets
function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a)
  const setB = new Set(b)
  const intersection = [...setA].filter((x) => setB.has(x)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

// Temperature similarity (0-1)
function tempSimilarity(a: number, b: number): number {
  return 1 - Math.abs(a - b) / 100
}

// Simple color similarity based on hex distance (simplified, not CIEDE2000 for MVP)
function colorSimilarity(colorsA: string[], colorsB: string[]): number {
  if (colorsA.length === 0 || colorsB.length === 0) return 0.5

  let totalSim = 0
  const pairs = Math.min(colorsA.length, colorsB.length)

  for (let i = 0; i < pairs; i++) {
    const a = hexToRgb(colorsA[i])
    const b = hexToRgb(colorsB[i])
    if (!a || !b) continue
    const dist = Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
    totalSim += 1 - dist / 441.67 // max distance = sqrt(255^2 * 3)
  }

  return totalSim / pairs
}

function hexToRgb(hex: string) {
  const m = hex.replace('#', '').match(/.{2}/g)
  if (!m) return null
  return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) }
}

// Archetype compatibility (same or adjacent categories get bonus)
const CATEGORY_ORDER = ['미니멀', '캐주얼', '스트릿', '클래식', '아티스틱', '페미닌', '맥시멀']

function archetypeCompatibility(catA: string, catB: string): number {
  if (catA === catB) return 0.9
  const idxA = CATEGORY_ORDER.indexOf(catA)
  const idxB = CATEGORY_ORDER.indexOf(catB)
  if (idxA === -1 || idxB === -1) return 0.5
  const dist = Math.abs(idxA - idxB)
  if (dist <= 1) return 0.75
  if (dist <= 2) return 0.6
  return 0.4
}

export function computeMatchScores(myProfile: StyleProfile, candidates: FakeProfile[]): Match[] {
  const results: Match[] = candidates.map((c) => {
    const kwSim = jaccard(myProfile.keywords, c.keywords)
    const tSim = tempSimilarity(myProfile.styleTemp, c.styleTemp)
    const moodSim = jaccard(myProfile.dateMoods, c.dateMoods)
    const cSim = colorSimilarity(myProfile.colorPalette, c.colorPalette)
    const archSim = archetypeCompatibility(myProfile.archetypeCategory, c.archetypeCategory)

    const syncScore = Math.round(
      (0.25 * kwSim + 0.15 * tSim + 0.25 * moodSim + 0.15 * cSim + 0.20 * archSim) * 100
    )

    // Generate chemistry note
    const sharedKeywords = myProfile.keywords.filter((k) => c.keywords.includes(k))
    const sharedMoods = myProfile.dateMoods.filter((m) => c.dateMoods.includes(m))

    let note = ''
    if (sharedKeywords.length > 0) {
      note += `👔 둘 다 ${sharedKeywords[0]} 스타일을 좋아해요! `
    }
    note += `🌡 꾸밈온도 : ${c.styleTemp}℃`
    if (sharedMoods.length > 0) {
      note += ` · 🎯 ${sharedMoods[0]} 데이트 추천`
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
      syncScore,
      chemistryNote: note,
    }
  })

  // Sort by score descending
  return results.sort((a, b) => b.syncScore - a.syncScore)
}
