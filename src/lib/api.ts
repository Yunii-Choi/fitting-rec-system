import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Gender } from '@/types/user'
import type { StyleProfile, KeywordEntry, ArchetypeWeight } from '@/types/style'
import type { Match } from '@/types/match'
import { ARCHETYPES, DATE_MOODS } from '@/lib/masterData'
import { VOCABULARY, NORMALIZE_MAP } from '@/data/keywordIndex'
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

// ── 프롬프트 데이터 ────────────────────────────────────────────────────

const ARCHETYPE_REGISTRY = ARCHETYPES.map((a) =>
  `${a.id}|${a.name}|${a.category}|${a.tempRange.min}-${a.tempRange.max}`
).join('\n')

const VOCAB_BLOCK = Object.entries(VOCABULARY)
  .map(([facet, terms]) => `  ${facet}: [${terms.join(', ')}]`)
  .join('\n')

const MOOD_NAMES = DATE_MOODS.map((m) => m.name).join(', ')

// ── 프롬프트 빌더 (V2) ────────────────────────────────────────────────

function buildPrompt(imageCount: number, gender: Gender): string {
  return `You are a fashion style analyst for a dating app called "fitting".
You will receive ${imageCount} OOTD (Outfit of the Day) photo(s) uploaded by a user (gender: ${gender === 'M' ? 'male' : 'female'}).

Your task: analyze the outfit(s) and produce a structured style profile.

═══ STEP 1: ARCHETYPE CLASSIFICATION + DISTRIBUTION ═══

From the registry below, select:
- "archetypeId": the single BEST matching archetype (primary)
- "archetypeDistribution": top 3 archetypes with confidence weights (sum to 1.0)

Each row: id|name|category|tempRange

${ARCHETYPE_REGISTRY}

Rules:
- The primary archetypeId must be the highest-weight entry in the distribution.
- Gender-specific archetypes (id 1: male only, id 2/24/25: female only) — respect the user's gender.
- Distribute remaining weight across 2 secondary archetypes that also fit.

═══ STEP 2: STYLE KEYWORDS WITH WEIGHTS ═══

Select 5-8 keywords ONLY from the lists below. Each keyword belongs to a facet.
Assign a weight (0.0-1.0) to each keyword reflecting how strongly it appears.
You MUST pick at least one from "genre" and one from "vibe".

${VOCAB_BLOCK}

Rules:
- ONLY use exact terms from the lists above. No synonyms, no free-text.
- Pick keywords that describe what you actually SEE in the photo(s).
- Spread across facets — don't cluster all keywords in one facet.
- Weights reflect visual prominence (1.0 = dominant feature, 0.3 = subtle).

═══ STEP 3: STYLE TEMPERATURE ═══

Rate the decoration effort on a 0-100 scale:
- 0 = zero effort (pajamas, no coordination)
- 50 = average daily wear
- 100 = fully styled (layered, accessorized, color-coordinated)

IMPORTANT: Your score MUST fall within the archetype's tempRange (see registry above).

═══ STEP 4: COLOR PALETTE ═══

Extract the 4 most dominant clothing colors as hex codes (#RRGGBB).
- Only colors from the CLOTHES — ignore skin, hair, background.
- Order from most dominant to least dominant.

═══ STEP 5: DATE MOODS ═══

Select 3-5 date activities that match this style, from this list ONLY:
${MOOD_NAMES}

═══ STEP 6: DESCRIPTION ═══

Write a one-sentence style description in casual Korean (20-50 characters).
Capture the vibe, not a literal description of clothes.

═══ STEP 7: CONSISTENCY (multi-photo only) ═══

If multiple photos are provided, rate how consistent the style is across photos:
- "consistencyKappa": 0.0 (completely different styles) to 1.0 (perfectly consistent)
If only 1 photo, set to 1.0.

═══ OUTPUT FORMAT ═══

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "archetypeId": <number>,
  "archetypeName": "<string>",
  "archetypeCategory": "<string>",
  "archetypeDistribution": [{"archetypeId": <number>, "weight": <float>}, ...],
  "styleTemp": <number>,
  "consistencyKappa": <float>,
  "keywords": [{"keyword": "<string>", "weight": <float>}, ...],
  "colorPalette": ["#RRGGBB", ...],
  "dateMoods": ["<string>", ...],
  "description": "<string in Korean>"
}`
}

// ── 키워드 → KeywordEntry 변환 (facet 자동 귀속) ────────────────────────

function toKeywordEntries(rawKeywords: { keyword: string; weight: number }[]): KeywordEntry[] {
  const entries: KeywordEntry[] = []
  for (const kw of rawKeywords) {
    if (!ALLOWED_KEYWORDS.has(kw.keyword)) continue
    const norm = NORMALIZE_MAP[kw.keyword]
    entries.push({
      keyword: kw.keyword,
      facet: norm?.facet ?? 'genre',
      weight: Math.max(0, Math.min(1, kw.weight)),
    })
  }
  return entries
}

// ── 아키타입 분포 검증 ──────────────────────────────────────────────────

function validateDistribution(raw: { archetypeId: number; weight: number }[], primaryId: number): ArchetypeWeight[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ archetypeId: primaryId, weight: 1.0 }]
  }
  // 유효한 아키타입만 필터
  const valid = raw.filter((d) => ARCHETYPES.some((a) => a.id === String(d.archetypeId)))
  if (valid.length === 0) return [{ archetypeId: primaryId, weight: 1.0 }]
  // 가중치 합 정규화
  const sum = valid.reduce((s, d) => s + d.weight, 0)
  return valid.map((d) => ({ archetypeId: d.archetypeId, weight: sum > 0 ? d.weight / sum : 1 / valid.length }))
}

// ── 메인 분석 함수 (V2) ────────────────────────────────────────────────

export async function analyzeStyle(input: AnalyzeInput): Promise<StyleProfile> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const imageParts = []
  const labels: string[] = []
  if (input.daily) { imageParts.push(await fileToGenerativePart(input.daily)); labels.push('Daily Look') }
  if (input.date) { imageParts.push(await fileToGenerativePart(input.date)); labels.push('Date Look') }
  if (input.mystyle) { imageParts.push(await fileToGenerativePart(input.mystyle)); labels.push('My Style') }

  if (imageParts.length === 0) throw new Error('최소 1장의 OOTD 사진이 필요합니다')

  const imageLabel = labels.length > 1
    ? `\n\nThe ${labels.length} photos below are labeled: ${labels.join(', ')}. Analyze them holistically as one person's style.`
    : ''

  const prompt = buildPrompt(imageParts.length, input.gender) + imageLabel

  const result = await model.generateContent([prompt, ...imageParts])
  const text = result.response.text()

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI 응답 파싱 실패')

  const parsed = JSON.parse(jsonMatch[0])

  // ── 검증 ──

  // 아키타입 ID
  const archId = Number(parsed.archetypeId)
  const archetype = ARCHETYPES.find((a) => a.id === String(archId))
  if (!archetype) throw new Error(`유효하지 않은 아키타입 ID: ${parsed.archetypeId}`)

  // 꾸밈온도 clamp
  const clampedTemp = Math.max(archetype.tempRange.min, Math.min(archetype.tempRange.max, Number(parsed.styleTemp)))

  // 아키타입 분포
  const distribution = validateDistribution(parsed.archetypeDistribution, archId)

  // 일관도 κ
  const kappa = Math.max(0, Math.min(1, Number(parsed.consistencyKappa) || (imageParts.length === 1 ? 1.0 : 0.85)))

  // 키워드 (V2: 가중치 포함)
  const rawKeywords: { keyword: string; weight: number }[] = Array.isArray(parsed.keywords)
    ? parsed.keywords.map((k: string | { keyword: string; weight: number }) =>
        typeof k === 'string' ? { keyword: k, weight: 1.0 } : k
      )
    : []
  const keywordEntries = toKeywordEntries(rawKeywords)
  const validKeywords = keywordEntries.map((e) => e.keyword)

  // 데이트무드 필터
  const validMoods = Array.isArray(parsed.dateMoods)
    ? parsed.dateMoods.filter((m: string) => ALLOWED_MOODS.has(m))
    : []

  return {
    userId: '',
    archetypeId: archId,
    archetypeName: archetype.name,
    archetypeCategory: archetype.category,
    archetypeDistribution: distribution,
    styleTemp: clampedTemp,
    consistencyKappa: kappa,
    keywords: validKeywords,
    keywordEntries,
    colorPalette: Array.isArray(parsed.colorPalette) ? parsed.colorPalette.slice(0, 4) : [],
    dateMoods: validMoods,
    description: parsed.description || '',
    generatedAt: new Date(),
  }
}

// ── 매칭 ───────────────────────────────────────────────────────────────

export async function getMatches(myProfile: StyleProfile, myGender: Gender): Promise<Match[]> {
  const oppositeGender: Gender = myGender === 'M' ? 'F' : 'M'
  const candidates: CandidateProfile[] = []

  try {
    const firestoreProfiles = await getAllStyleProfiles(myProfile.userId)
    if (firestoreProfiles.length > 0) {
      const userIds = firestoreProfiles.map((p) => p.id)
      const userMap = await getUserProfiles(userIds)

      for (const sp of firestoreProfiles) {
        const user = userMap.get(sp.id)
        if (user?.gender && user.gender !== oppositeGender) continue

        candidates.push({
          id: sp.id,
          nickname: user?.nickname ?? '익명',
          age: user?.age ?? 0,
          archetypeId: sp.archetypeId,
          archetypeName: sp.archetypeName ?? '',
          archetypeCategory: sp.archetypeCategory ?? '',
          archetypeDistribution: sp.archetypeDistribution,
          styleTemp: sp.styleTemp ?? 50,
          consistencyKappa: sp.consistencyKappa ?? 1.0,
          keywords: sp.keywords ?? [],
          keywordEntries: sp.keywordEntries,
          colorPalette: sp.colorPalette ?? [],
          dateMoods: sp.dateMoods ?? [],
          outfitUrls: user?.outfitUrls ?? getArchetypeImageUrls(String(sp.archetypeId ?? '1')),
          description: sp.description ?? '',
        })
      }
    }
  } catch (err) {
    console.warn('[getMatches] Firestore 조회 실패:', err)
  }

  const scored = computeMatchScores(myProfile, candidates)
  return scored.slice(0, 10)
}
