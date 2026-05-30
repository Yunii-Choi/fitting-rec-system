import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '@/stores/profileStore'
import Button from '@/components/ui/Button'
import PhotoSlot from '@/components/upload/PhotoSlot'

export default function OotdUploadPage() {
  const navigate = useNavigate()
  const { outfitImages, setOutfitImage } = useProfileStore()

  const hasDaily = !!outfitImages.daily

  const handleSubmit = () => {
    if (hasDaily) navigate('/analyzing')
  }

  return (
    <div className="flex-1 flex flex-col px-5 py-8">
      {/* Header */}
      <p className="text-center text-sm text-text-secondary leading-relaxed mb-6">
        얼굴은 가려도 괜찮아요.<br />
        착장이 잘 보이는 OOTD 사진을 올려주세요.
      </p>

      {/* Upload Slots */}
      <div className="flex flex-col gap-3">
        <PhotoSlot
          number="01"
          icon="👕"
          label="데일리룩"
          note="평소 스타일"
          required
          file={outfitImages.daily}
          onSelect={(f) => setOutfitImage('daily', f)}
        />
        <PhotoSlot
          number="02"
          icon="💃"
          label="데이트룩"
          note="만남 스타일"
          file={outfitImages.date}
          onSelect={(f) => setOutfitImage('date', f)}
        />
        <PhotoSlot
          number="03"
          icon="✨"
          label="가장 나다운 룩"
          note="자기다운 스타일"
          file={outfitImages.mystyle}
          onSelect={(f) => setOutfitImage('mystyle', f)}
        />
      </div>

      <p className="text-center text-xs text-text-dim mt-4">
        📸 최소 1장(데일리룩) 필수 · 최대 3장
      </p>

      <div className="flex-1" />

      <Button onClick={handleSubmit} disabled={!hasDaily} className={!hasDaily ? 'opacity-50' : ''}>
        스타일 분석 시작
      </Button>
    </div>
  )
}
