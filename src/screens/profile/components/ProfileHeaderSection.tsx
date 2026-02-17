'use client'

import type { PropsWithChildren } from 'react'
import { useEffect, useMemo, useState } from 'react'

import type { ProfileResponse } from '@/features/auth/types'
import type { EditFormState } from '@/screens/profile/profile-components.types'
import type { Instrument, MediaItem, MediaType, PrivacySettings } from '@/shared/types/profile'
import { authApi } from '@/features/auth/api'
import { instrumentsApi } from '@/features/instruments/api'
import { feedApi } from '@/features/feed/api'
import { getApiErrorMessage } from '@/shared/api/errors'
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
    instruments?: Instrument[]
    description?: string | null
  }>({})
  const [editForm, setEditForm] = useState<EditFormState>({
    name: '',
    login: '',
    email: '',
    description: '',
  })
  const [availableInstruments, setAvailableInstruments] = useState<Instrument[]>([])
  const [selectedInstrumentIds, setSelectedInstrumentIds] = useState<number[]>([])
  const [instrumentsLoading, setInstrumentsLoading] = useState(false)
  const [instrumentsError, setInstrumentsError] = useState<string | null>(null)
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null)
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profilePublic: true,
    showAge: true,
    showEmail: false,
    mediaPublic: true,
  })
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)

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
        description: profileOverrides.description ?? user.description ?? '',
      })
      setEditAvatarFile(null)
      setEditError(null)
      setEditLoading(false)
      setSelectedInstrumentIds(
        (profileOverrides.instruments ?? user.instruments).map(
          (instrument) => instrument.id,
        ),
      )
    }
  }, [isEditOpen, profileOverrides, user])

  useEffect(() => {
    if (isPrivacyOpen) {
      setPrivacyError(null)
      setPrivacyLoading(false)
    }
  }, [isPrivacyOpen])

  useEffect(() => {
    let isActive = true

    const loadMedia = () => {
      setMediaLoading(true)
      setMediaError(null)

      feedApi
        .listMedia()
        .then((response) => {
          if (!isActive) {
            return
          }
          setMediaItems(
            response.items.map((item) => ({
              relative_path: item.relative_path,
              extension: item.extension,
              feedId: item.feedId,
            })),
          )
        })
        .catch((error) => {
          if (isActive) {
            setMediaError(getApiErrorMessage(error))
          }
        })
        .finally(() => {
          if (isActive) {
            setMediaLoading(false)
          }
        })
    }

    loadMedia()

    const handleMediaRefresh = () => {
      loadMedia()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('profile:media-refresh', handleMediaRefresh)
    }

    return () => {
      isActive = false
      if (typeof window !== 'undefined') {
        window.removeEventListener('profile:media-refresh', handleMediaRefresh)
      }
    }
  }, [])

  useEffect(() => {
    if (!isEditOpen) {
      return
    }

    let isActive = true
    const loadInstruments = async () => {
      setInstrumentsLoading(true)
      setInstrumentsError(null)
      try {
        const response = await instrumentsApi.list()
        if (isActive) {
          setAvailableInstruments(response.items)
        }
      } catch (error) {
        if (isActive) {
          setInstrumentsError(getApiErrorMessage(error))
        }
      } finally {
        if (isActive) {
          setInstrumentsLoading(false)
        }
      }
    }

    loadInstruments()

    return () => {
      isActive = false
    }
  }, [isEditOpen])

  const displayName = profileOverrides.name ?? user.name
  const displayLogin = profileOverrides.login ?? user.login
  const displayEmail = profileOverrides.email ?? user.email ?? null
  const displayDescription = profileOverrides.description ?? user.description ?? null
  const displayAvatarUrl =
    profileOverrides.avatarUrl ??
    (user.avatarPath ? getMediaUrl(user.avatarPath) : undefined)
  const displayInstruments = profileOverrides.instruments ?? user.instruments

  const handleCopyUuid = async () => {
    await navigator.clipboard.writeText(user.uuid)
  }

  const handleSaveProfile = () => {
    setEditError(null)

    if (!editForm.name.trim() || !editForm.login.trim()) {
      setEditError('Имя и логин обязательны')
      return
    }

    const updateProfile = async () => {
      setEditLoading(true)
      try {
        const avatarResponse = editAvatarFile
          ? await authApi.updateAvatar(editAvatarFile)
          : null
        const [instrumentsResponse] = await Promise.all([
          instrumentsApi.setMyInstruments(selectedInstrumentIds),
          authApi.updateDescription(editForm.description.trim() || null),
        ])
        setProfileOverrides({
          name: editForm.name.trim(),
          login: editForm.login.trim(),
          email: editForm.email.trim() || null,
          avatarUrl:
            avatarResponse?.relativePath
              ? getMediaUrl(avatarResponse.relativePath)
              : profileOverrides.avatarUrl,
          instruments: instrumentsResponse.items,
          description: editForm.description.trim() || null,
        })
        setIsEditOpen(false)
      } catch (error) {
        setEditError(getApiErrorMessage(error))
      } finally {
        setEditLoading(false)
      }
    }

    updateProfile()
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
        description={displayDescription ?? 'Здесь может быть статус или короткое описание.'}
        instruments={displayInstruments}
        followersCount={0}
        followingCount={0}
        onOpenEdit={() => setIsEditOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="order-2 space-y-6 lg:order-1 lg:row-span-2">
          <ProfileMediaCard
            mediaItems={mediaItems}
            activeTab={activeMediaTab}
            isLoading={mediaLoading}
            error={mediaError}
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
        instruments={availableInstruments}
        selectedInstrumentIds={selectedInstrumentIds}
        instrumentsLoading={instrumentsLoading}
        instrumentsError={instrumentsError}
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
        onToggleInstrument={(instrumentId, nextValue) =>
          setSelectedInstrumentIds((prev) => {
            if (nextValue) {
              if (prev.includes(instrumentId)) {
                return prev
              }
              return [...prev, instrumentId]
            }
            return prev.filter((id) => id !== instrumentId)
          })
        }
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
