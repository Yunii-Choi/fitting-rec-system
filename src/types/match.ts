export interface AxisBreakdown {
  archetype: number | null
  keyword: number | null
  temp: number | null
  color: number | null
}

export interface Match {
  matchId: string
  partnerId: string
  partnerNickname: string
  partnerAge: number
  partnerArchetype: string
  partnerKeywords: string[]
  partnerColorPalette: string[]
  partnerDateMoods: string[]
  partnerOutfitUrls: string[]
  syncScore: number
  axisBreakdown: AxisBreakdown
  chemistryNote: string
}
