export interface StyleProfile {
  userId: string
  archetypeName: string
  archetypeCategory: string
  styleTemp: number
  keywords: string[]
  colorPalette: string[]
  dateMoods: string[]
  description: string
  generatedAt: Date
}

export interface Archetype {
  id: string
  category: string
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
