'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useShallow } from 'zustand/shallow'

import { useAuthStore } from '@/features/auth/store'
import type {
  ComposerAttachment,
  FeedPost,
  MediaItem,
  MediaType,
  PostMedia,
  PrivacySettings,
} from '@/shared/types/profile'
import type { EditFormState } from '@/screens/profile/profile-components.types'
import { getMediaUrl } from '@/shared/config/api'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { ProfileComposer } from '@/screens/profile/components/ProfileComposer'
import { ProfileFeed } from '@/screens/profile/components/ProfileFeed'
import { ProfileHeaderCard } from '@/screens/profile/components/ProfileHeaderCard'
import { ProfileInfoCard } from '@/screens/profile/components/ProfileInfoCard'
import { ProfileMediaCard } from '@/screens/profile/components/ProfileMediaCard'
import { ProfileDialogs } from '@/screens/profile/components/ProfileDialogs'
import { MediaDialogs } from '@/screens/profile/components/MediaDialogs'
import { ProfileSkeleton } from '@/screens/profile/components/ProfileSkeleton'

const createId = (): string => {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const buildMockMedia = (): MediaItem[] => [
  {
    id: 'media-1',
    type: 'image',
    thumbUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=400&q=80',
    createdAt: '2 дня назад',
  },
  {
    id: 'media-2',
    type: 'video',
    thumbUrl:
      'https://images.unsplash.com/photo-1497032205916-ac775f0649ae?auto=format&fit=crop&w=400&q=80',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    createdAt: '3 дня назад',
  },
  {
    id: 'media-3',
    type: 'image',
    thumbUrl:
      'https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=400&q=80',
    createdAt: '1 неделя назад',
  },
  {
    id: 'media-4',
    type: 'image',
    thumbUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80',
    createdAt: '2 недели назад',
  },
  {
    id: 'media-5',
    type: 'video',
    thumbUrl:
      'https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=400&q=80',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    createdAt: 'месяц назад',
  },
]

const buildMockPosts = (): FeedPost[] => [
  {
    id: 'post-1',
    author: {
      name: 'Соната Team',
      login: 'sonata',
      avatarUrl:
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=200&q=80',
    },
    createdAt: '2 часа назад',
    text: 'Запустили обновленную ленту. Теперь можно добавлять медиа и делиться плейлистами!',
    stats: { likes: 24, comments: 7 },
  },
  {
    id: 'post-2',
    author: {
      name: 'Марина',
      login: 'marina',
      avatarUrl:
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80',
    },
    createdAt: 'вчера',
    text: 'Новый плейлист для вечерних джемов 🎶',
    media: [
      {
        id: 'post-2-media-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=900&q=80',
      },
      {
        id: 'post-2-media-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
      },
    ],
    stats: { likes: 51, comments: 12 },
  },
  {
    id: 'post-3',
    author: {
      name: 'Денис',
      login: 'den',
      avatarUrl:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    },
    createdAt: '3 дня назад',
    text: 'Короткий разбор новой цепочки эффектов. Видео ниже.',
    media: [
      {
        id: 'post-3-media-1',
        type: 'video',
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        thumbUrl:
          'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80',
      },
    ],
    stats: { likes: 17, comments: 3 },
  },
]

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

  const [contentLoading, setContentLoading] = useState(true)
  const [activeMediaTab, setActiveMediaTab] = useState<'all' | MediaType>('all')
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [selectedPostMedia, setSelectedPostMedia] = useState<PostMedia | null>(
    null,
  )
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [privacyLoading, setPrivacyLoading] = useState(false)
  const [privacyError, setPrivacyError] = useState<string | null>(null)
  const [composerText, setComposerText] = useState('')
  const [composerError, setComposerError] = useState<string | null>(null)
  const [composerLoading, setComposerLoading] = useState(false)
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([])
  const [localMediaUrls, setLocalMediaUrls] = useState<string[]>([])
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({})
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

  const localMediaUrlsRef = useRef<string[]>([])
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const composerRef = useRef<HTMLDivElement | null>(null)

  const mediaItems = useMemo(() => buildMockMedia(), [])
  const [posts, setPosts] = useState<FeedPost[]>(() => buildMockPosts())

  const editAvatarPreview = useMemo(() => {
    if (!editAvatarFile) {
      return null
    }
    return URL.createObjectURL(editAvatarFile)
  }, [editAvatarFile])

  useEffect(() => {
    if (status === 'idle') {
      init()
      return
    }

    if (status === 'guest') {
      router.replace('/auth')
    }
  }, [init, router, status])

  useEffect(() => {
    if (status === 'authenticated') {
      const timeout = setTimeout(() => setContentLoading(false), 700)
      return () => clearTimeout(timeout)
    }

    return undefined
  }, [status])

  useEffect(() => {
    localMediaUrlsRef.current = localMediaUrls
  }, [localMediaUrls])

  useEffect(() => {
    return () => {
      localMediaUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  useEffect(() => {
    return () => {
      if (editAvatarPreview) {
        URL.revokeObjectURL(editAvatarPreview)
      }
    }
  }, [editAvatarPreview])

  useEffect(() => {
    if (isEditOpen && user) {
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

  if (status === 'idle' || status === 'loading' || contentLoading) {
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

  const displayName = profileOverrides.name ?? user.name
  const displayLogin = profileOverrides.login ?? user.login
  const displayEmail = profileOverrides.email ?? user.email
  const displayAvatarUrl =
    profileOverrides.avatarUrl ??
    (user.avatarPath ? getMediaUrl(user.avatarPath) : undefined)

  const handleAddFiles = (files: FileList | null, type: MediaType) => {
    if (!files?.length) {
      return
    }

    const newItems = Array.from(files).map((file) => ({
      id: createId(),
      type,
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    setAttachments((prev) => [...prev, ...newItems])
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((item) => item.id !== id)
    })
  }

  const handleComposerSubmit = () => {
    setComposerError(null)

    if (!composerText.trim() && attachments.length === 0) {
      setComposerError('Добавьте текст или медиа')
      return
    }

    setComposerLoading(true)

    const createdUrls: string[] = []
    const newPostMedia = attachments.map((item) => {
      const mediaUrl = URL.createObjectURL(item.file)
      createdUrls.push(mediaUrl)
      return {
        id: item.id,
        type: item.type,
        url: mediaUrl,
        thumbUrl: item.type === 'video' ? mediaUrl : undefined,
      }
    })

    setTimeout(() => {
      setPosts((prev) => [
        {
          id: createId(),
          author: {
            name: displayName,
            login: displayLogin,
            avatarUrl: displayAvatarUrl,
          },
          createdAt: 'только что',
          text: composerText.trim() || undefined,
          media: newPostMedia.length ? newPostMedia : undefined,
          stats: { likes: 0, comments: 0 },
        },
        ...prev,
      ])
      setComposerText('')
      attachments.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      setAttachments([])
      setLocalMediaUrls((prev) => [...prev, ...createdUrls])
      setComposerLoading(false)
    }, 800)
  }

  const handleCopyUuid = async () => {
    await navigator.clipboard.writeText(user.uuid)
  }

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  const handleToggleLike = (postId: string) => {
    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }))
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
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <ProfileHeaderCard
        displayName={displayName}
        displayLogin={displayLogin}
        avatarUrl={displayAvatarUrl}
        description="Здесь может быть статус или короткое описание."
        onOpenEdit={() => setIsEditOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <ProfileMediaCard
            mediaItems={mediaItems}
            activeTab={activeMediaTab}
            onTabChange={setActiveMediaTab}
            onSelectMedia={setSelectedMedia}
            onCreatePost={() =>
              composerRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
          />
          <ProfileInfoCard
            uuid={user.uuid}
            email={displayEmail}
            age={user.age}
            onCopyUuid={handleCopyUuid}
          />
        </div>

        <div className="space-y-6">
          <ProfileComposer
            composerText={composerText}
            composerError={composerError}
            composerLoading={composerLoading}
            attachments={attachments}
            imageInputRef={imageInputRef}
            videoInputRef={videoInputRef}
            composerRef={composerRef}
            onTextChange={setComposerText}
            onAddFiles={handleAddFiles}
            onRemoveAttachment={handleRemoveAttachment}
            onSubmit={handleComposerSubmit}
          />

          <ProfileFeed
            posts={posts}
            likedPosts={likedPosts}
            onToggleLike={handleToggleLike}
            onDeletePost={handleDeletePost}
            onSelectMedia={setSelectedPostMedia}
            onCreateFirstPost={() =>
              composerRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
          />
        </div>
      </div>

      <MediaDialogs
        selectedMedia={selectedMedia}
        selectedPostMedia={selectedPostMedia ?? null}
        onCloseMedia={() => setSelectedMedia(null)}
        onClosePostMedia={() => setSelectedPostMedia(null)}
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
          setEditForm((prev) => ({ ...prev, [field]: value }))
        }
        onEditAvatarChange={setEditAvatarFile}
        onSaveEdit={handleSaveProfile}
        onSavePrivacy={handleSavePrivacy}
        onPrivacyChange={(field, value) =>
          setPrivacySettings((prev) => ({ ...prev, [field]: value }))
        }
      />
    </div>
  )
}
