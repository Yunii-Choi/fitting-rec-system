import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { Gender } from '@/types/user'
import type { StyleProfile } from '@/types/style'

// ── Users ──

export interface UserDoc {
  nickname: string
  gender: Gender
  age: number
  outfitUrls: string[]
  createdAt: ReturnType<typeof serverTimestamp>
}

export async function saveUserProfile(
  userId: string,
  data: { nickname: string; gender: Gender; age: number; outfitUrls: string[] },
) {
  const ref = doc(db, 'users', userId)
  const existing = await getDoc(ref)

  if (existing.exists()) {
    await setDoc(ref, { ...data }, { merge: true })
  } else {
    await setDoc(ref, { ...data, createdAt: serverTimestamp() })
  }
}

export async function getUserProfile(userId: string) {
  const snap = await getDoc(doc(db, 'users', userId))
  return snap.exists() ? (snap.data() as UserDoc) : null
}

// ── Style Profiles ──

export interface StyleProfileDoc {
  userId: string
  archetypeId: number
  archetypeName: string
  archetypeCategory: string
  styleTemp: number
  keywords: string[]
  colorPalette: string[]
  dateMoods: string[]
  description: string
  generatedAt: ReturnType<typeof serverTimestamp>
}

export async function saveStyleProfile(userId: string, profile: StyleProfile) {
  await setDoc(doc(db, 'styleProfiles', userId), {
    userId,
    archetypeId: profile.archetypeId,
    archetypeName: profile.archetypeName,
    archetypeCategory: profile.archetypeCategory,
    styleTemp: profile.styleTemp,
    keywords: profile.keywords,
    colorPalette: profile.colorPalette,
    dateMoods: profile.dateMoods,
    description: profile.description,
    generatedAt: serverTimestamp(),
  })
}

export async function getStyleProfile(userId: string) {
  const snap = await getDoc(doc(db, 'styleProfiles', userId))
  if (!snap.exists()) return null
  const data = snap.data() as StyleProfileDoc
  return {
    ...data,
    generatedAt:
      data.generatedAt instanceof Timestamp
        ? data.generatedAt.toDate()
        : new Date(),
  } as StyleProfile
}

// ── Get all style profiles for matching ──

export async function getAllStyleProfiles(excludeUserId: string) {
  const snap = await getDocs(collection(db, 'styleProfiles'))
  const profiles: (StyleProfileDoc & { id: string })[] = []
  snap.forEach((doc) => {
    if (doc.id !== excludeUserId) {
      profiles.push({ id: doc.id, ...(doc.data() as StyleProfileDoc) })
    }
  })
  return profiles
}

// ── Get user info for matched profiles ──

export async function getUserProfiles(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, UserDoc>()

  const result = new Map<string, UserDoc>()
  // Firestore 'in' query supports max 30 items
  const chunks = []
  for (let i = 0; i < userIds.length; i += 30) {
    chunks.push(userIds.slice(i, i + 30))
  }

  for (const chunk of chunks) {
    const q = query(collection(db, 'users'), where('__name__', 'in', chunk))
    const snap = await getDocs(q)
    snap.forEach((doc) => {
      result.set(doc.id, doc.data() as UserDoc)
    })
  }
  return result
}

// ── Matches (좋아요/넘기기 이력) ──

export async function saveLikeAction(
  fromUserId: string,
  toUserId: string,
  action: 'like' | 'pass',
) {
  const docId = `${fromUserId}_${toUserId}`
  await setDoc(doc(db, 'likes', docId), {
    from: fromUserId,
    to: toUserId,
    action,
    createdAt: serverTimestamp(),
  })
}

export async function checkMutualLike(userA: string, userB: string) {
  const docId = `${userB}_${userA}`
  const snap = await getDoc(doc(db, 'likes', docId))
  return snap.exists() && snap.data()?.action === 'like'
}
