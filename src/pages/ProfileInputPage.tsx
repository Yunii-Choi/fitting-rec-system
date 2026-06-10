import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '@/stores/profileStore'
import Button from '@/components/ui/Button'
import GenderToggle from '@/components/ui/GenderToggle'

export default function ProfileInputPage() {
  const navigate = useNavigate()
  const { nickname, gender, age, setNickname, setGender, setAge } = useProfileStore()

  const isValid = nickname.trim().length >= 2 && age && Number(age) >= 18

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) navigate('/upload')
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-5 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 rounded-full bg-accent-dim text-accent text-xs font-semibold">
          FASHION MATCHING
        </span>
        <h1 className="text-xl font-bold mt-4 leading-snug">
          옷만 보고,<br />
          이 사람이랑<br />
          사귈 수 있을까?
        </h1>
        <p className="text-text-dim text-xs mt-2 leading-relaxed">
          OOTD로 나의 꾸밈 바이브를 분석하고,<br />
          스타일 케미가 맞는 사람을 찾아보세요.
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-text-dim mb-1.5 block">👤 성별</label>
          <GenderToggle value={gender} onChange={setGender} />
        </div>

        <div>
          <label className="text-xs text-text-dim mb-1.5 block">✏ 닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="2자 이상 입력"
            className="w-full py-2.5 px-3 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-dim outline-none focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-text-dim mb-1.5 block">🎂 나이</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="나이 입력"
            min={18}
            max={99}
            className="w-full py-2.5 px-3 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-dim outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div className="flex-1" />

      <Button type="submit" disabled={!isValid} className={!isValid ? 'opacity-50' : ''}>
        내 스타일 분석하기
      </Button>
    </form>
  )
}
