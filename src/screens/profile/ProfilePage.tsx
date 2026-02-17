'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useShallow } from 'zustand/shallow'

import { useAuthStore } from '@/features/auth/store'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { ProfileHeaderSection } from '@/screens/profile/components/ProfileHeaderSection'
import { ProfileSkeleton } from '@/screens/profile/components/ProfileSkeleton'
import {
  ProfileWallSection,
  type ProfileWallSectionHandle,
} from '@/screens/profile/components/ProfileWallSection'

export const ProfilePage = () => {
  const { init, status, user, error } = useAuthStore(
    useShallow((state) => ({
      init: state.init,
      status: state.status,
      user: state.user,
      error: state.error,
    })),
  )
  const router = useRouter()
  const wallRef = useRef<ProfileWallSectionHandle | null>(null)

  useEffect(() => {
    if (status === 'idle') {
      init()
      return
    }

    if (status === 'guest') {
      router.replace('/auth')
    }
  }, [init, router, status])

  if (status === 'idle' || status === 'loading') {
    return <ProfileSkeleton />
  }

  if (status === 'error' && error) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <Alert variant="destructive">
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <ProfileHeaderSection
        user={user}
        onCreatePost={() => wallRef.current?.focusComposer()}
      >
        <ProfileWallSection ref={wallRef} status={status} currentUser={user} />
      </ProfileHeaderSection>
    </div>
  )
}
