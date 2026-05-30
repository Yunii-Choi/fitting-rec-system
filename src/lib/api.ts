import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Gender } from '@/types/user'
import type { StyleProfile } from '@/types/style'
import type { Match } from '@/types/match'
import { ARCHETYPES, DATE_MOODS } from '@/lib/masterData'
import { computeMatchScores } from '@/lib/matching'
import { FAKE_PROFILES } from '@/lib/fakeProfiles'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '')

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

export async function analyzeStyle(input: AnalyzeInput): Promise<StyleProfile> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  // Prepare images
  const imageParts = []
  if (input.daily) imageParts.push(await fileToGenerativePart(input.daily))
  if (input.date) imageParts.push(await fileToGenerativePart(input.date))
  if (input.mystyle) imageParts.push(await fileToGenerativePart(input.mystyle))

  const archetypeNames = ARCHETYPES.map((a) => a.name).join(', ')
  const moodNames = DATE_MOODS.map((m) => m.name).join(', ')

  const prompt = `당신은 패션 스타일 분석 전문가입니다. 업로드된 OOTD 사진을 분석하여 아래 JSON 형식으로 정확히 응답하세요.
반드시 아래 목록에서만 선택해야 합니다.

[사용 가능한 스타일 아키타입]: ${archetypeNames}
[사용 가능한 데이트 무드]: ${moodNames}

분석 기준:
- styleTemp: 꾸밈 정도 (0=노력 없음, 100=완벽하게 꾸밈). 옷의 핏, 레이어링, 소품, 컬러 코디 ��을 종합 판단.
- keywords: 해당 아키타입의 대표 키워드 4개
- colorPalette: 착장에서 보이는 주요 컬러 4개 (hex code)
- dateMoods: 이 스타일과 어울리는 데이트 장소/활동 3~4개
- description: 이 사람의 패션 스타일을 설명하는 한 문장 (캐주얼한 한국어, 20자~50자)

JSON만 응답��세요 (마크다운 코드블록 없이):
{"archetypeName": "string", "archetypeCategory": "string", "styleTemp": number, "keywords": ["string"], "colorPalette": ["#hex"], "dateMoods": ["string"], "description": "string"}`

  const result = await model.generateContent([prompt, ...imageParts])
  const text = result.response.text()

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI 응답 파싱 실패')

  const parsed = JSON.parse(jsonMatch[0])

  return {
    userId: '',
    archetypeName: parsed.archetypeName,
    archetypeCategory: parsed.archetypeCategory,
    styleTemp: parsed.styleTemp,
    keywords: parsed.keywords,
    colorPalette: parsed.colorPalette,
    dateMoods: parsed.dateMoods,
    description: parsed.description,
    generatedAt: new Date(),
  }
}

export async function getMatches(myProfile: StyleProfile): Promise<Match[]> {
  // For MVP: use fake profiles and compute scores client-side
  const scored = computeMatchScores(myProfile, FAKE_PROFILES)
  return scored.slice(0, 10)
}
