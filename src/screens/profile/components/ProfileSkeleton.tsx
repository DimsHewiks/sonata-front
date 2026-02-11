'use client'

import type { ProfileSkeletonProps } from '@/screens/profile/profile-components.types'
import { Skeleton } from '@/ui/widgets/skeleton'

export const ProfileSkeleton = ({ className }: ProfileSkeletonProps) => {
  return (
    <div className={className ?? 'mx-auto w-full max-w-6xl space-y-6'}>
      <Skeleton className="h-36 w-full" />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  )
}
