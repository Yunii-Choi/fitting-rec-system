// ── V2 확장 타입 ────────────────────────────────────────────────────────

export interface KeywordEntry {
  keyword: string
  facet: string
  weight: number
}

export interface ArchetypeWeight {
  archetypeId: number
  weight: number
}

// ── 스타일 프로필 ───────────────────────────────────────────────────────

export interface StyleProfile {
  userId: string
  archetypeId: number
  archetypeName: string
  archetypeCategory: string
  archetypeDistribution: ArchetypeWeight[]
  styleTemp: number
  consistencyKappa: number
  keywords: string[]
  keywordEntries: KeywordEntry[]
  colorPalette: string[]
  dateMoods: string[]
  description: string
  generatedAt: Date
}

// ── 아키타입 / 데이트무드 ───────────────────────────────────────────────

export type ArchetypeGender = 'M' | 'F' | 'U'

export interface Archetype {
  id: string
  category: string
  gender: ArchetypeGender
  name: string
  keywords: string[]
  tempRange: { min: number; max: number }
  description: string
}

export interface DateMood {
  id: string
  name: string
  icon: string
  category: string
  matchingArchetypes: string[]
}
