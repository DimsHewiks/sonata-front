export type MediaType = 'image' | 'video'

export interface MediaFile {
  original_name?: string
  saved_name?: string
  full_path?: string
  relative_path: string
  size?: number
  extension: string
  uploaded?: boolean
  errors?: string | null
}

export interface MediaItem extends MediaFile {
  createdAt?: string
}

export interface PostAuthor {
  name: string
  login: string
  avatar?: MediaFile | null
}

export type PostMedia = MediaFile

export interface FeedPost {
  id: string
  type: 'post'
  author: PostAuthor
  createdAt: string
  text?: string
  media?: PostMedia[]
  stats?: {
    likes: number
    comments: number
  }
}

export interface FeedComment {
  id: string
  feedId?: string
  parentId?: string | null
  author: PostAuthor
  createdAt: string
  text?: string
  media?: MediaFile[]
  children: FeedComment[]
}

export interface FeedPollOption {
  id: string
  text: string
  votes: number
}

export interface FeedPoll {
  id: string
  type: 'poll'
  author: PostAuthor
  createdAt: string
  question: string
  options: FeedPollOption[]
  multiple: boolean
  totalVotes: number
  duration: string
  userVoteIds: string[]
}

export interface FeedQuizOption {
  id: string
  text: string
}

export interface FeedQuiz {
  id: string
  type: 'quiz'
  author: PostAuthor
  createdAt: string
  question: string
  options: FeedQuizOption[]
  correctOptionId?: string | null
  explanation?: string
  isCorrect?: boolean | null
  userAnswerId: string | null
}

export interface FeedArticle {
  id: string
  type: 'article'
  author: PostAuthor
  createdAt: string
  title: string
  description: string
  readTime: string
}

export type FeedItem = FeedPost | FeedPoll | FeedQuiz | FeedArticle

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
