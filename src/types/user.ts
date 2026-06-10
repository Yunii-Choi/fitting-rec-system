export type Gender = 'M' | 'F'

export interface UserProfile {
  userId: string
  nickname: string
  gender: Gender
  age: number
  createdAt: Date
}

export interface UserOutfit {
  outfitId: string
  categoryCode: 'daily' | 'date' | 'mystyle'
  categoryName: string
  imageUrl: string
  uploadedAt: Date
}
