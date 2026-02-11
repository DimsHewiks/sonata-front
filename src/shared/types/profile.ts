export type MediaType = 'image' | 'video'

export interface MediaItem {
  id: string
  type: MediaType
  thumbUrl: string
  url?: string
  createdAt: string
}

export interface PostAuthor {
  name: string
  login: string
  avatarUrl?: string
}

export interface PostMedia {
  id: string
  type: MediaType
  url: string
  thumbUrl?: string
}

export interface FeedPost {
  id: string
  author: PostAuthor
  createdAt: string
  text?: string
  media?: PostMedia[]
  stats?: {
    likes: number
    comments: number
  }
}

export interface ComposerAttachment {
  id: string
  type: MediaType
  file: File
  previewUrl: string
}

export interface PrivacySettings {
  profilePublic: boolean
  showAge: boolean
  showEmail: boolean
  mediaPublic: boolean
}
