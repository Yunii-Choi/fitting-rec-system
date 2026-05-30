import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProfileStore } from '@/stores/profileStore'
import Button from '@/components/ui/Button'
import KeywordTag from '@/components/ui/KeywordTag'
import MoodTag from '@/components/ui/MoodTag'
import TempBar from '@/components/ui/TempBar'
import ColorPalette from '@/components/ui/ColorPalette'

export default function StyleProfilePage() {
  const navigate = useNavigate()
  const { styleProfile, nickname, outfitImages } = useProfileStore()

  if (!styleProfile) {
    navigate('/profile', { replace: true })
    return null
  }

  const dailyPreview = outfitImages.daily ? URL.createObjectURL(outfitImages.daily) : null

  return (
    <motion.div
      className="flex-1 flex flex-col px-5 py-6 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Badge */}
      <div className="text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-accent-dim text-accent text-xs font-semibold">
          ✦ AI STYLE
        </span>
      </div>

      {/* Main Photo */}
      <div className="w-3/4 mx-auto aspect-square rounded-xl overflow-hidden border-2 border-accent bg-surface">
        {dailyPreview ? (
          <img src={dailyPreview} alt="OOTD" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">👕</div>
        )}
      </div>

      {/* Archetype */}
      <div className="text-center">
        <p className="text-text-secondary text-sm">
          <strong className="text-text text-lg font-bold">{nickname}</strong>님은
        </p>
        <p className="text-text text-lg font-bold">{styleProfile.archetypeName}</p>
        <p className="text-text-muted text-xs mt-1">🌡 꾸밈온도 {styleProfile.styleTemp}℃</p>
      </div>

      {/* Keywords */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {styleProfile.keywords.map((kw) => (
          <KeywordTag key={kw} keyword={kw} />
        ))}
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-3 bg-surface-alt rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">🔥 꾸밈 온도</span>
          <div className="w-32">
            <TempBar value={styleProfile.styleTemp} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">🎨 컬러 팔레트</span>
          <ColorPalette colors={styleProfile.colorPalette} />
        </div>

        <div>
          <span className="text-xs text-text-muted">💫 데이트 무드</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {styleProfile.dateMoods.map((mood) => (
              <MoodTag key={mood} mood={mood} />
            ))}
          </div>
        </div>
      </div>

      {/* AI Description */}
      <div className="bg-surface-alt border-l-2 border-accent rounded-lg p-3">
        <p className="text-xs text-text-muted leading-relaxed">
          🤖 "{styleProfile.description}"
        </p>
      </div>

      <div className="flex-1" />

      <Button onClick={() => navigate('/matches')}>
        나와 스타일 케미가 맞는 사람 만나보기
      </Button>
    </motion.div>
  )
}
