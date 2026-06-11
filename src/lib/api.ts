import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Gender } from '@/types/user'
import type { StyleProfile } from '@/types/style'
import type { Match } from '@/types/match'
import { ARCHETYPES, DATE_MOODS } from '@/lib/masterData'
import { VOCABULARY } from '@/data/keywordIndex'
import { computeMatchScores, type CandidateProfile } from '@/lib/matching'
import { getAllStyleProfiles, getUserProfiles } from '@/lib/firestore'
import { getArchetypeImageUrls } from '@/lib/driveImages'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '')

// ── 허용 목록 (서버 측 필터용) ──────────────────────────────────────────

const ALLOWED_KEYWORDS = new Set(Object.values(VOCABULARY).flat())
const ALLOWED_MOODS = new Set(DATE_MOODS.map((m) => m.name))

interface AnalyzeInput {
  daily: File | null
  date: File | null
  mystyle: File | null
  nickname: string
  gender: Gender
  age: number
}

async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      resolve({
        inlineData: {
          data: base64,
          mimeType: file.type,
        },
      })
    }
    reader.onerror = () => reject(new Error('파일 읽기 실패'))
    reader.readAsDataURL(file)
  })
}

// ── 아키타입 레지스트리 (프롬프트용) ────────────────────────────────────

const ARCHETYPE_REGISTRY = ARCHETYPES.map((a) =>
  `${a.id}|${a.name}|${a.category}|${a.tempRange.min}-${a.tempRange.max}`
).join('\n')

// ── 통제 어휘 (프롬프트용) ──────────────────────────────────────────────

const VOCAB_BLOCK = Object.entries(VOCABULARY)
  .map(([facet, terms]) => `  ${facet}: [${terms.join(', ')}]`)
  .join('\n')

// ── 데이트 무드 목록 ────────────────────────────────────────────────────

const MOOD_NAMES = DATE_MOODS.map((m) => m.name).join(', ')

// ── 프롬프트 빌더 ──────────────────────────────────────────────────────

function buildPrompt(imageCount: number, gender: Gender): string {
  return `You are a fashion style analyst for a dating app called "fitting".
You will receive ${imageCount} OOTD (Outfit of the Day) photo(s) uploaded by a user (gender: ${gender === 'M' ? 'male' : 'female'}).

Your task: analyze the outfit(s) and produce a structured style profile.

═══ STEP 1: ARCHETYPE CLASSIFICATION ═══

Choose the single best-matching archetype from the registry below.
Each row: id|name|category|tempRange

${ARCHETYPE_REGISTRY}

Rules:
- Pick the archetype whose visual style most closely matches the outfit(s).
- Gender-specific archetypes (id 1: male, id 2/24/25: female) — respect the user's gender.
- If multiple photos are provided, choose the archetype that best represents the overall style.

═══ STEP 2: STYLE KEYWORDS (CONTROLLED VOCABULARY) ═══

Select 5-8 keywords ONLY from the lists below. Each keyword belongs to a facet.
You MUST pick at least one from "genre" and one from "vibe".

${VOCAB_BLOCK}

Rules:
- ONLY use exact terms from the lists above. No synonyms, no free-text.
- Pick keywords that describe what you actually SEE in the photo(s).
- Spread across facets — don't cluster all keywords in one facet.

═══ STEP 3: STYLE TEMPERATURE ═══

Rate the decoration effort on a 0-100 scale:
- 0 = zero effort (pajamas, no coordination)
- 50 = average daily wear
- 100 = fully styled (layered, accessorized, color-coordinated)

IMPORTANT: Your score MUST fall within the archetype's tempRange (see registry above).
If the outfit seems outside the range, clamp to the nearest boundary.

═══ STEP 4: COLOR PALETTE ═══

Extract the 4 most dominant clothing colors as hex codes (#RRGGBB).
- Only colors from the CLOTHES — ignore skin, hair, background.
- Order from most dominant to least dominant.
- Use accurate hex values based on what you see.

═══ STEP 5: DATE MOODS ═══

Select 3-5 date activities that match this style, from this list ONLY:
${MOOD_NAMES}

═══ STEP 6: DESCRIPTION ═══

Write a one-sentence style description in casual Korean (20-50 characters).
Capture the vibe, not a literal description of clothes.

═══ OUTPUT FORMAT ═══

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "archetypeId": <number>,
  "archetypeName": "<string>",
  "archetypeCategory": "<string>",
  "styleTemp": <number>,
  "keywords": ["<string>", ...],
  "colorPalette": ["#RRGGBB", ...],
  "dateMoods": ["<string>", ...],
  "description": "<string in Korean>"
}`
}

// ── 메인 분석 함수 ─────────────────────────────────────────────────────

export async function analyzeStyle(input: AnalyzeInput): Promise<StyleProfile> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  // Prepare images
  const imageParts = []
  const labels: string[] = []
  if (input.daily) {
    imageParts.push(await fileToGenerativePart(input.daily))
    labels.push('Daily Look')
  }
  if (input.date) {
    imageParts.push(await fileToGenerativePart(input.date))
    labels.push('Date Look')
  }
  if (input.mystyle) {
    imageParts.push(await fileToGenerativePart(input.mystyle))
    labels.push('My Style')
  }

  if (imageParts.length === 0) {
    throw new Error('최소 1장의 OOTD 사진이 필요합니다')
  }

  const imageLabel = labels.length > 1
    ? `\n\nThe ${labels.length} photos below are labeled: ${labels.join(', ')}. Analyze them holistically as one person's style.`
    : ''

  const prompt = buildPrompt(imageParts.length, input.gender) + imageLabel

  const result = await model.generateContent([prompt, ...imageParts])
  const text = result.response.text()

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI 응답 파싱 실패')

  const parsed = JSON.parse(jsonMatch[0])

  // Validate archetypeId
  const archId = Number(parsed.archetypeId)
  const archetype = ARCHETYPES.find((a) => a.id === String(archId))
  if (!archetype) {
    throw new Error(`유효하지 않은 아키타입 ID: ${parsed.archetypeId}`)
  }

  // Clamp styleTemp to archetype range
  const clampedTemp = Math.max(
    archetype.tempRange.min,
    Math.min(archetype.tempRange.max, Number(parsed.styleTemp))
  )

  // 통제 어휘 필터: 허용 목록에 없는 키워드/무드 제거
  const validKeywords = Array.isArray(parsed.keywords)
    ? parsed.keywords.filter((k: string) => ALLOWED_KEYWORDS.has(k))
    : []
  const validMoods = Array.isArray(parsed.dateMoods)
    ? parsed.dateMoods.filter((m: string) => ALLOWED_MOODS.has(m))
    : []

  return {
    userId: '',
    archetypeId: archId,
    archetypeName: archetype.name,
    archetypeCategory: archetype.category,
    styleTemp: clampedTemp,
    keywords: validKeywords,
    colorPalette: Array.isArray(parsed.colorPalette) ? parsed.colorPalette.slice(0, 4) : [],
    dateMoods: validMoods,
    description: parsed.description || '',
    generatedAt: new Date(),
  }
}

export async function getMatches(myProfile: StyleProfile, myGender: Gender): Promise<Match[]> {
  const oppositeGender: Gender = myGender === 'M' ? 'F' : 'M'
  const candidates: CandidateProfile[] = []

  // 1) Firestore 프로필 조회 (더미 + 실사용자)
  try {
    const firestoreProfiles = await getAllStyleProfiles(myProfile.userId)
    if (firestoreProfiles.length > 0) {
      const userIds = firestoreProfiles.map((p) => p.id)
      const userMap = await getUserProfiles(userIds)

      for (const sp of firestoreProfiles) {
        const user = userMap.get(sp.id)
        // 이성 필터: 상대방 성별이 반대여야 매칭
        if (user?.gender && user.gender !== oppositeGender) continue

        candidates.push({
          id: sp.id,
          nickname: user?.nickname ?? '익명',
          age: user?.age ?? 0,
          archetypeId: sp.archetypeId,
          archetypeName: sp.archetypeName,
          archetypeCategory: sp.archetypeCategory,
          styleTemp: sp.styleTemp,
          keywords: sp.keywords,
          colorPalette: sp.colorPalette,
          dateMoods: sp.dateMoods,
          outfitUrls: user?.outfitUrls ?? getArchetypeImageUrls(String(sp.archetypeId ?? '1')),
          description: sp.description,
        })
      }
    }
  } catch (err) {
    console.warn('[getMatches] Firestore 조회 실패:', err)
  }

  const scored = computeMatchScores(myProfile, candidates)
  return scored.slice(0, 10)
}
