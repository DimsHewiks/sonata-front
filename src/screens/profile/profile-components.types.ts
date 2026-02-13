import type {
  FeedArticle,
  FeedItem,
  MediaItem,
  MediaType,
  PostMedia,
  PrivacySettings,
} from '@/shared/types/profile'

export type ComposerType = 'post' | 'poll' | 'quiz' | 'article'

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

export interface ProfileFeedProps {
  items: FeedItem[]
  likedPosts: Record<string, boolean>
  onToggleLike: (postId: string) => void
  onDeleteItem: (postId: string) => Promise<void>
  onCommentCountChange: (postId: string, delta: number) => void
  onSelectMedia: (item: PostMedia) => void
  onCreateFirstPost: () => void
  onVotePoll: (pollId: string, optionIds: string[]) => void
  onAnswerQuiz: (quizId: string, optionId: string) => void
  onOpenArticle: (article: FeedArticle) => void
  quizAnswerLoadingIds: Record<string, boolean>
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
