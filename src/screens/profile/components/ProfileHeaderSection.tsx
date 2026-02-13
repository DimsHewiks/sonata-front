'use client'

import type { PropsWithChildren } from 'react'
import { useEffect, useMemo, useState } from 'react'

import type { ProfileResponse } from '@/features/auth/types'
import type { EditFormState } from '@/screens/profile/profile-components.types'
import type { MediaItem, MediaType, PrivacySettings } from '@/shared/types/profile'
import { getMediaUrl } from '@/shared/config/api'
import { MediaDialogs } from '@/screens/profile/components/MediaDialogs'
import { ProfileDialogs } from '@/screens/profile/components/ProfileDialogs'
import { ProfileHeaderCard } from '@/screens/profile/components/ProfileHeaderCard'
import { ProfileInfoCard } from '@/screens/profile/components/ProfileInfoCard'
import { ProfileMediaCard } from '@/screens/profile/components/ProfileMediaCard'

interface ProfileHeaderSectionProps extends PropsWithChildren {
  user: ProfileResponse
  onCreatePost: () => void
}

const buildMockMedia = (): MediaItem[] => [
  {
    relative_path:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=400&q=80',
    extension: 'jpg',
    createdAt: '2 дня назад',
  },
  {
    relative_path:
      'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    extension: 'mp4',
    createdAt: '3 дня назад',
  },
  {
    relative_path:
      'https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=400&q=80',
    extension: 'jpg',
    createdAt: '1 неделя назад',
  },
  {
    relative_path:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80',
    extension: 'jpg',
    createdAt: '2 недели назад',
  },
  {
    relative_path:
      'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    extension: 'mp4',
    createdAt: 'месяц назад',
  },
]

export const ProfileHeaderSection = ({ user, onCreatePost, children }: ProfileHeaderSectionProps) => {
  const [activeMediaTab, setActiveMediaTab] = useState<'all' | MediaType>('all')
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [privacyLoading, setPrivacyLoading] = useState(false)
  const [privacyError, setPrivacyError] = useState<string | null>(null)
  const [profileOverrides, setProfileOverrides] = useState<{
    name?: string
    login?: string
    email?: string | null
    avatarUrl?: string
  }>({})
  const [editForm, setEditForm] = useState<EditFormState>({
    name: '',
    login: '',
    email: '',
  })
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null)
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profilePublic: true,
    showAge: true,
    showEmail: false,
    mediaPublic: true,
  })

  const mediaItems = useMemo(() => buildMockMedia(), [])

  const editAvatarPreview = useMemo(() => {
    if (!editAvatarFile) {
      return null
    }
    return URL.createObjectURL(editAvatarFile)
  }, [editAvatarFile])

  useEffect(() => {
    return () => {
      if (editAvatarPreview) {
        URL.revokeObjectURL(editAvatarPreview)
      }
    }
  }, [editAvatarPreview])

  useEffect(() => {
    if (isEditOpen) {
      setEditForm({
        name: profileOverrides.name ?? user.name,
        login: profileOverrides.login ?? user.login,
        email: profileOverrides.email ?? user.email ?? '',
      })
      setEditAvatarFile(null)
      setEditError(null)
      setEditLoading(false)
    }
  }, [isEditOpen, profileOverrides, user])

  useEffect(() => {
    if (isPrivacyOpen) {
      setPrivacyError(null)
      setPrivacyLoading(false)
    }
  }, [isPrivacyOpen])

  const displayName = profileOverrides.name ?? user.name
  const displayLogin = profileOverrides.login ?? user.login
  const displayEmail = profileOverrides.email ?? user.email ?? null
  const displayAvatarUrl =
    profileOverrides.avatarUrl ??
    (user.avatarPath ? getMediaUrl(user.avatarPath) : undefined)

  const handleCopyUuid = async () => {
    await navigator.clipboard.writeText(user.uuid)
  }

  const handleSaveProfile = () => {
    setEditError(null)

    if (!editForm.name.trim() || !editForm.login.trim()) {
      setEditError('Имя и логин обязательны')
      return
    }

    setEditLoading(true)

    setTimeout(() => {
      setProfileOverrides({
        name: editForm.name.trim(),
        login: editForm.login.trim(),
        email: editForm.email.trim() || null,
        avatarUrl: editAvatarPreview ?? profileOverrides.avatarUrl,
      })
      setEditLoading(false)
      setIsEditOpen(false)
    }, 800)
  }

  const handleSavePrivacy = () => {
    setPrivacyError(null)
    setPrivacyLoading(true)

    setTimeout(() => {
      setPrivacyLoading(false)
      setIsPrivacyOpen(false)
    }, 700)
  }

  return (
    <>
      <ProfileHeaderCard
        displayName={displayName}
        displayLogin={displayLogin}
        avatarUrl={displayAvatarUrl}
        description="Здесь может быть статус или короткое описание."
        onOpenEdit={() => setIsEditOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="order-2 space-y-6 lg:order-1 lg:row-span-2">
          <ProfileMediaCard
            mediaItems={mediaItems}
            activeTab={activeMediaTab}
            onTabChange={setActiveMediaTab}
            onSelectMedia={setSelectedMedia}
            onCreatePost={onCreatePost}
          />
          <ProfileInfoCard
            uuid={user.uuid}
            email={displayEmail}
            age={user.age}
            onCopyUuid={handleCopyUuid}
          />
        </div>

        <div className="order-1 space-y-6 lg:order-2 lg:col-start-2 lg:row-start-1">
          {children}
        </div>
      </div>

      <MediaDialogs
        selectedMedia={selectedMedia}
        selectedPostMedia={null}
        onCloseMedia={() => setSelectedMedia(null)}
        onClosePostMedia={() => undefined}
      />

      <ProfileDialogs
        isEditOpen={isEditOpen}
        isPrivacyOpen={isPrivacyOpen}
        editForm={editForm}
        editAvatarPreview={editAvatarPreview}
        editAvatarFileName={editAvatarFile?.name ?? null}
        editLoading={editLoading}
        editError={editError}
        privacySettings={privacySettings}
        privacyLoading={privacyLoading}
        privacyError={privacyError}
        onEditOpenChange={setIsEditOpen}
        onPrivacyOpenChange={setIsPrivacyOpen}
        onEditFieldChange={(field, value) =>
          setEditForm((prev) => ({
            ...prev,
            [field]: value,
          }))
        }
        onEditAvatarChange={setEditAvatarFile}
        onSaveEdit={handleSaveProfile}
        onSavePrivacy={handleSavePrivacy}
        onPrivacyChange={(field, value) =>
          setPrivacySettings((prev) => ({
            ...prev,
            [field]: value,
          }))
        }
      />
    </>
  )
}
