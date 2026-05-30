import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function MobileShell({ children }: Props) {
  return (
    <div className="mx-auto w-full max-w-[430px] min-h-dvh flex flex-col relative bg-bg">
      {children}
    </div>
  )
}
