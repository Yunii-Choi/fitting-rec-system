import type { Gender } from '@/types/user'

interface Props {
  value: Gender
  onChange: (v: Gender) => void
}

export default function GenderToggle({ value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange('M')}
        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
          value === 'M'
            ? 'bg-accent text-bg font-bold'
            : 'bg-surface border border-border text-text-muted'
        }`}
      >
        ♂ 남성
      </button>
      <button
        type="button"
        onClick={() => onChange('F')}
        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
          value === 'F'
            ? 'bg-accent text-bg font-bold'
            : 'bg-surface border border-border text-text-muted'
        }`}
      >
        ♀ 여성
      </button>
    </div>
  )
}
