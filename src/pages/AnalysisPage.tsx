import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ProgressSteps from '@/components/ui/ProgressSteps'
import { useProfileStore } from '@/stores/profileStore'
import { useAuthStore } from '@/stores/authStore'
import { analyzeStyle } from '@/lib/api'
import { saveUserProfile, saveStyleProfile } from '@/lib/firestore'
import { uploadAllOutfits } from '@/lib/storageUpload'

const STEPS = [
  { label: 'OOTD 이미지 분석', icon: '📷' },
  { label: '스타일 키워드 추출', icon: '🏷' },
  { label: '꾸밈 온도 계산', icon: '🌡' },
  { label: '데이트 무드 추출', icon: '🍷' },
  { label: 'Style Profile 생성', icon: '🧬' },
]

export default function AnalysisPage() {
  const navigate = useNavigate()
  const { outfitImages, nickname, gender, age, setStyleProfile } = useProfileStore()
  const user = useAuthStore((s) => s.user)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Animate progress steps
    const interval = setInterval(() => {
      setCurrentStep((s) => {
        if (s >= STEPS.length - 1) {
          clearInterval(interval)
          return s
        }
        return s + 1
      })
    }, 1800)

    // Call AI analysis + save to Firestore/Storage
    const run = async () => {
      try {
        const userId = user?.uid
        if (!userId) throw new Error('로그인이 필요합니다')

        // 1) AI 분석과 이미지 업로드를 병렬 실행
        const [profile, outfitUrls] = await Promise.all([
          analyzeStyle({
            daily: outfitImages.daily,
            date: outfitImages.date,
            mystyle: outfitImages.mystyle,
            nickname,
            gender,
            age: Number(age),
          }),
          uploadAllOutfits(userId, outfitImages),
        ])

        profile.userId = userId

        // 2) Firestore에 유저 프로필 + 스타일 프로필 저장
        await Promise.all([
          saveUserProfile(userId, {
            nickname,
            gender,
            age: Number(age),
            outfitUrls,
          }),
          saveStyleProfile(userId, profile),
        ])

        setStyleProfile(profile)
        // Wait for animation to catch up then navigate
        setTimeout(() => navigate('/style-profile', { replace: true }), 1000)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(`분석 중 오류가 발생했어요: ${msg}`)
        console.error('Analysis error:', err)
      }
    }

    run()
    return () => clearInterval(interval)
  }, [])

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
      <motion.h2
        className="text-lg font-bold text-center leading-snug"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        스타일 무드를<br />분석중이에요
      </motion.h2>

      {/* Spinner */}
      <div className="w-12 h-12 border-3 border-surface border-t-accent rounded-full animate-spin" />

      {/* Steps */}
      <ProgressSteps steps={STEPS} currentStep={currentStep} />

      {/* Progress Bar */}
      <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-accent to-[#a0cc00] rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {error ? (
        <div className="text-center">
          <p className="text-like text-sm mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-accent text-sm underline"
          >
            다시 분석하기
          </button>
        </div>
      ) : (
        <p className="text-text-dim text-xs">컬러 팔레트를 분석하고 있어요...</p>
      )}
    </div>
  )
}
