import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  label: string
  note: string
  icon: string
  number: string
  required?: boolean
  file: File | null
  onSelect: (file: File | null) => void
}

export default function PhotoSlot({ label, note, icon, number, required, file, onSelect }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [showPopup, setShowPopup] = useState(false)

  const handleFile = (f: File | null) => {
    onSelect(f)
    if (f) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview(null)
    }
    setShowPopup(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] || null)
  }

  const hasFile = !!file

  return (
    <>
      <button
        type="button"
        onClick={() => setShowPopup(true)}
        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
          hasFile ? 'border-accent bg-surface-alt' : 'border-border bg-surface'
        }`}
      >
        {/* Hidden file inputs */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleChange}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />

        {preview ? (
          <div className="w-12 h-14 rounded-lg overflow-hidden flex-shrink-0">
            <img src={preview} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div
            className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              hasFile ? 'bg-accent text-bg' : 'bg-border text-text-dim'
            }`}
          >
            {number}
          </div>
        )}

        <div className="flex-1 text-left">
          <div className="text-sm font-semibold text-text-secondary">
            {icon} {label}
          </div>
          <div className="text-xs text-text-dim mt-0.5">
            {required ? '필수' : '선택'} · {note}
          </div>
        </div>

        {hasFile && <span className="text-accent text-xs">✓</span>}
      </button>

      {/* Upload option popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-bg/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPopup(false)}
          >
            <motion.div
              className="w-full max-w-[430px] bg-surface border-t border-border rounded-t-2xl p-5 pb-8"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
              <p className="text-sm text-text-secondary text-center mb-4">
                사진을 어떻게 올릴까요?
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="w-full py-3 rounded-xl bg-surface-alt border border-border text-sm font-semibold text-text flex items-center justify-center gap-2"
                >
                  📷 사진 찍기
                </button>
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  className="w-full py-3 rounded-xl bg-accent text-bg text-sm font-semibold flex items-center justify-center gap-2"
                >
                  🖼 앨범에서 선택
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="w-full mt-3 py-2.5 text-text-dim text-xs"
              >
                취소
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
