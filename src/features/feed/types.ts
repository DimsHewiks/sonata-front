import type { FeedComment, FeedCommentReaction, FeedItem } from '@/shared/types/profile'

export interface FeedListResponse {
  items: FeedItem[]
}

export interface FeedListQuery {
  offset?: number
  limit?: number
}

export interface FeedCreateResponse {
  item: FeedItem
}

export interface FeedDeleteResponse {
  deleted: boolean
  feedId: string
}

export interface CreatePostPayload {
  text?: string
  media?: File[]
}

export interface CreatePollPayload {
  question: string
  options: string[]
  multiple: boolean
  duration: string
}

export interface CreateQuizPayload {
  question: string
  options: string[]
  correctOptionId: string
  explanation?: string
}

export interface CreateArticlePayload {
  title: string
  description: string
}

export interface QuizAnswerPayload {
  feedId: string
  answerId: string
}

export interface QuizAnswerResult {
  feedId: string
  userAnswerId: string
  isCorrect: boolean
  correctOptionId: string
}

export interface QuizAnswerResponse {
  result: QuizAnswerResult
}

export type FeedCommentsOrder = 'asc' | 'desc'

export interface FeedCommentListResponse {
  items?: FeedComment[]
  comments?: FeedComment[]
}

export interface CreateFeedCommentPayload {
  text?: string
  media?: File[]
  parentId?: string
}

export interface FeedCommentCreateResponse {
  comment?: FeedComment
  result?: FeedComment
  item?: FeedComment
}

export interface FeedCommentDeleteResponse {
  deleted: boolean
  commentId?: string
}

export interface ToggleFeedCommentReactionPayload {
  emoji: string
}

export interface FeedCommentReactionToggleResult {
  commentId: string
  reactions: FeedCommentReaction[]
}

export interface FeedCommentReactionToggleResponse {
  result?: FeedCommentReactionToggleResult
  item?: FeedCommentReactionToggleResult
  data?: FeedCommentReactionToggleResult
  commentId?: string
  reactions?: FeedCommentReaction[]
}

export interface FeedMediaItem {
  relative_path: string
  extension: string
  feedId: string
}

export interface FeedMediaResponse {
  items: FeedMediaItem[]
}
