import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200",
        "bg-[length:200%_100%] animate-shimmer rounded",
        className
      )}
    />
  )
}
