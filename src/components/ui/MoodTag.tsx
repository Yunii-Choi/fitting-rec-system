interface Props {
  mood: string
}

export default function MoodTag({ mood }: Props) {
  return (
    <span className="inline-block px-2 py-0.5 bg-[rgba(196,160,255,0.12)] rounded-lg text-mood text-xs">
      {mood}
    </span>
  )
}
