import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMatchStore } from '@/stores/matchStore'
import { useProfileStore } from '@/stores/profileStore'
import { useAuthStore } from '@/stores/authStore'
import MatchCard from '@/components/match/MatchCard'
import { getMatches } from '@/lib/api'
import { saveLikeAction, checkMutualLike } from '@/lib/firestore'

export default function MatchListPage() {
  const { matches, currentIndex, loading, matchSuccess, setMatches, setLoading, nextMatch, setMatchSuccess } = useMatchStore()
  const styleProfile = useProfileStore((s) => s.styleProfile)
  const myGender = useProfileStore((s) => s.gender)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await getMatches(styleProfile!, myGender)
        setMatches(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (styleProfile) load()
  }, [styleProfile])

  const handleLike = async () => {
    const current = matches[currentIndex]
    if (!current || !user) return

    // Firestore에 좋아요 저장 (V2: axis_breakdown 포함)
    await saveLikeAction(user.uid, current.partnerId, 'like', current.syncScore, current.axisBreakdown)

    // 상호 매칭 체크
    const mutual = await checkMutualLike(user.uid, current.partnerId)
    if (mutual) {
      setMatchSuccess(true)
      setTimeout(() => setMatchSuccess(false), 3000)
    }
    nextMatch()
  }

  const handlePass = async () => {
    const current = matches[currentIndex]
    if (current && user) {
      await saveLikeAction(user.uid, current.partnerId, 'pass', current.syncScore, current.axisBreakdown)
    }
    nextMatch()
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const current = matches[currentIndex]

  return (
    <div className="flex-1 flex flex-col px-5 py-6">
      <p className="text-center text-sm text-text-secondary mb-4">
        💘 당신과 스타일 무드가<br />맞는 사람을 찾았어요.
      </p>

      {current ? (
        <AnimatePresence mode="wait">
          <MatchCard
            key={current.matchId}
            match={current}
            onLike={handleLike}
            onPass={handlePass}
          />
        </AnimatePresence>
      ) : (
        <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
          더 이상 매칭할 상대가 없어요 😢
        </div>
      )}

      {/* Pagination dots */}
      {matches.length > 0 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {matches.slice(0, 5).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                i === currentIndex % 5 ? 'bg-accent' : 'bg-border'
              }`}
            />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-text-dim mt-3">
        ← 스와이프로 다른 매치 보기 →
      </p>

      {/* Match Success Popup */}
      <AnimatePresence>
        {matchSuccess && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-surface border border-accent rounded-2xl p-8 text-center mx-6"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <div className="text-5xl mb-4">💘</div>
              <h3 className="text-xl font-bold text-accent mb-2">매칭 성공!</h3>
              <p className="text-text-muted text-sm">
                서로 스타일이 통했어요!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
