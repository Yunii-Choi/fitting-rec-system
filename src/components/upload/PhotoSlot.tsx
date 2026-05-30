import { useRef, useState } from 'react'

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
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    onSelect(f)
    if (f) {
      const url = URL.createObjectURL(f)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  const hasFile = !!file

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
        hasFile ? 'border-accent bg-surface-alt' : 'border-border bg-surface'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
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
  )
}
