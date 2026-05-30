interface Props {
  keyword: string
}

export default function KeywordTag({ keyword }: Props) {
  return (
    <span className="inline-block px-2.5 py-1 bg-accent-dim rounded-lg text-accent text-xs font-medium">
      #{keyword}
    </span>
  )
}
