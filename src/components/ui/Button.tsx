import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export default function Button({ variant = 'primary', className = '', children, ...props }: Props) {
  const base = 'w-full py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]'
  const variants = {
    primary: 'bg-accent text-bg hover:brightness-110',
    secondary: 'bg-surface border border-border text-text-secondary hover:bg-border',
    ghost: 'bg-transparent text-text-muted hover:text-text',
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
