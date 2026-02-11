import type { RefObject } from 'react'

import type {
  ComposerAttachment,
  FeedPost,
  MediaItem,
  MediaType,
  PostMedia,
  PrivacySettings,
} from '@/shared/types/profile'

export interface ProfileHeaderProps {
  displayName: string
  displayLogin: string
  avatarUrl?: string
  description: string
  onOpenEdit: () => void
  onOpenPrivacy: () => void
}

export interface ProfileInfoCardProps {
  uuid: string
  email: string | null
  age: number
  onCopyUuid: () => void
}

export interface ProfileMediaCardProps {
  mediaItems: MediaItem[]
  activeTab: 'all' | MediaType
  onTabChange: (value: 'all' | MediaType) => void
  onSelectMedia: (item: MediaItem) => void
  onCreatePost: () => void
}

export interface ProfileComposerProps {
  composerText: string
  composerError: string | null
  composerLoading: boolean
  attachments: ComposerAttachment[]
  imageInputRef: RefObject<HTMLInputElement>
  videoInputRef: RefObject<HTMLInputElement>
  composerRef: RefObject<HTMLDivElement>
  onTextChange: (value: string) => void
  onAddFiles: (files: FileList | null, type: MediaType) => void
  onRemoveAttachment: (id: string) => void
  onSubmit: () => void
}

export interface ProfileFeedProps {
  posts: FeedPost[]
  likedPosts: Record<string, boolean>
  onToggleLike: (postId: string) => void
  onDeletePost: (postId: string) => void
  onSelectMedia: (item: PostMedia) => void
  onCreateFirstPost: () => void
}

export interface MediaDialogsProps {
  selectedMedia: MediaItem | null
  selectedPostMedia: PostMedia | null
  onCloseMedia: () => void
  onClosePostMedia: () => void
}

export interface EditFormState {
  name: string
  login: string
  email: string
}

export interface ProfileDialogsProps {
  isEditOpen: boolean
  isPrivacyOpen: boolean
  editForm: EditFormState
  editAvatarPreview: string | null
  editAvatarFileName: string | null
  editLoading: boolean
  editError: string | null
  privacySettings: PrivacySettings
  privacyLoading: boolean
  privacyError: string | null
  onEditOpenChange: (open: boolean) => void
  onPrivacyOpenChange: (open: boolean) => void
  onEditFieldChange: (field: keyof EditFormState, value: string) => void
  onEditAvatarChange: (file: File | null) => void
  onSaveEdit: () => void
  onSavePrivacy: () => void
  onPrivacyChange: (field: keyof PrivacySettings, value: boolean) => void
}

export interface ProfileSkeletonProps {
  className?: string
}
