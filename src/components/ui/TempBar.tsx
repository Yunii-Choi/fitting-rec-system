interface Props {
  value: number // 0-100
}

export default function TempBar({ value }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: 'linear-gradient(90deg, #c8ff00, #ff6b00)',
          }}
        />
      </div>
      <span className="text-xs font-semibold text-text">{value}℃</span>
    </div>
  )
}
