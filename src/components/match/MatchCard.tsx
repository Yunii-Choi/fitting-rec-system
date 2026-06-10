import { motion } from 'framer-motion'
import KeywordTag from '@/components/ui/KeywordTag'
import type { Match } from '@/types/match'

interface Props {
  match: Match
  onLike: () => void
  onPass: () => void
}

export default function MatchCard({ match, onLike, onPass }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3"
    >
      {/* Chemistry Score */}
      <div className="text-center">
        <div className="text-xs text-text-muted uppercase tracking-widest mb-1">✦ STYLE SYNC</div>
        <div className="text-4xl font-black text-accent">
          {match.syncScore}<span className="text-lg text-text-dim">%</span>
        </div>
        <div className="text-xs text-text-muted mt-1">🔗 분위기 싱크율</div>
      </div>

      {/* Photo Grid */}
      <div className="flex gap-1.5">
        {match.partnerOutfitUrls.slice(0, 3).map((url, i) => (
          <div
            key={i}
            className="flex-1 aspect-square rounded-lg overflow-hidden border border-accent bg-surface"
          >
            {url ? (
              <img src={url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl text-text-dim">
                📸
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="text-center">
        <span className="text-xl font-bold">{match.partnerNickname}</span>
        <span className="text-sm text-text-muted ml-2">{match.partnerAge}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center">
        {match.partnerKeywords.map((kw) => (
          <KeywordTag key={kw} keyword={kw} />
        ))}
      </div>

      <div className="text-xs text-text-muted bg-surface-alt rounded-lg p-3 leading-relaxed">
        {match.chemistryNote}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={onLike}
          className="flex-1 py-3 rounded-xl bg-[rgba(255,80,120,0.12)] text-like font-bold text-sm active:scale-95 transition-transform"
        >
          ♥ 좋아요
        </button>
        <button
          onClick={onPass}
          className="flex-1 py-3 rounded-xl bg-surface text-text-dim font-medium text-sm active:scale-95 transition-transform"
        >
          패스
        </button>
      </div>
    </motion.div>
  )
}
