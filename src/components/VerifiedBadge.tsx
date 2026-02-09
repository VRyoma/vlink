import { BadgeCheck } from 'lucide-react'

interface VerifiedBadgeProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function VerifiedBadge({ className = '', size = 'md' }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return (
    <BadgeCheck
      className={`${sizeClasses[size]} text-blue-500 inline-block ${className}`}
      aria-label="認証済みクリエイター"
    />
  )
}
