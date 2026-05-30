interface Props {
  colors: string[]
}

export default function ColorPalette({ colors }: Props) {
  return (
    <div className="flex gap-1.5">
      {colors.map((hex, i) => (
        <div
          key={i}
          className="w-6 h-6 rounded-full border border-border"
          style={{ backgroundColor: hex }}
        />
      ))}
    </div>
  )
}
