import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/config/firebase'

type OutfitCategory = 'daily' | 'date' | 'mystyle'

export async function uploadOutfitImage(
  userId: string,
  category: OutfitCategory,
  file: File,
): Promise<string> {
  const timestamp = Date.now()
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `ootd/${userId}/${category}/${timestamp}.${ext}`
  const storageRef = ref(storage, path)

  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export async function uploadAllOutfits(
  userId: string,
  images: { daily: File | null; date: File | null; mystyle: File | null },
): Promise<string[]> {
  const urls: string[] = []
  const categories: OutfitCategory[] = ['daily', 'date', 'mystyle']

  for (const cat of categories) {
    const file = images[cat]
    if (file) {
      const url = await uploadOutfitImage(userId, cat, file)
      urls.push(url)
    }
  }

  return urls
}
