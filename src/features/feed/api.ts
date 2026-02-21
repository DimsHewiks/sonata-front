import { apiClient } from '@/shared/api/client'
import type { FeedComment, FeedItem } from '@/shared/types/profile'
import type {
  CreateArticlePayload,
  CreateFeedCommentPayload,
  CreatePollPayload,
  CreatePostPayload,
  CreateQuizPayload,
  FeedCommentCreateResponse,
  FeedCommentDeleteResponse,
  FeedCommentListResponse,
  FeedCommentReactionToggleResponse,
  FeedCommentReactionToggleResult,
  FeedCommentsOrder,
  FeedCreateResponse,
  FeedDeleteResponse,
  FeedListQuery,
  FeedListResponse,
  FeedMediaResponse,
  QuizAnswerPayload,
  QuizAnswerResponse,
  QuizAnswerResult,
  ToggleFeedCommentReactionPayload,
} from '@/features/feed/types'

const normalizeFeedItem = (item: FeedItem): FeedItem => {
  if (item.type === 'poll') {
    return {
      ...item,
      userVoteIds: item.userVoteIds ?? [],
    }
  }

  if (item.type === 'quiz') {
    return {
      ...item,
      userAnswerId: item.userAnswerId ?? null,
      isCorrect: item.isCorrect ?? null,
      correctOptionId: item.correctOptionId ?? null,
    }
  }

  return item
}

const normalizeComment = (comment: FeedComment): FeedComment => {
  const normalizedReactions = (comment.reactions ?? [])
    .map((reaction) => ({
      emoji: reaction.emoji,
      count: Number.isFinite(reaction.count) ? Math.max(0, Math.floor(reaction.count)) : 0,
      active: Boolean(reaction.active),
    }))
    .filter((reaction) => reaction.emoji)

  return {
    ...comment,
    reactions: normalizedReactions,
    children: (comment.children ?? []).map(normalizeComment),
  }
}

const normalizeCommentReactionToggleResult = (
  payload: FeedCommentReactionToggleResult | null | undefined,
): FeedCommentReactionToggleResult | null => {
  if (!payload || typeof payload.commentId !== 'string') {
    return null
  }

  return {
    commentId: payload.commentId,
    reactions: (payload.reactions ?? [])
      .map((reaction) => ({
        emoji: reaction.emoji,
        count: Number.isFinite(reaction.count) ? Math.max(0, Math.floor(reaction.count)) : 0,
        active: Boolean(reaction.active),
      }))
      .filter((reaction) => reaction.emoji),
  }
}

const isFeedComment = (value: unknown): value is FeedComment => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  if (!('id' in value)) {
    return false
  }

  return typeof value.id === 'string'
}

const normalizeFeedListQuery = (query?: FeedListQuery): Record<string, number> => {
  if (!query) {
    return {}
  }

  const params: Record<string, number> = {}
  if (typeof query.offset === 'number' && Number.isFinite(query.offset) && query.offset >= 0) {
    params.offset = Math.floor(query.offset)
  }
  if (typeof query.limit === 'number' && Number.isFinite(query.limit) && query.limit > 0) {
    params.limit = Math.floor(query.limit)
  }

  return params
}

export const feedApi = {
  list: async (query?: FeedListQuery): Promise<FeedItem[]> => {
    const response = await apiClient.get<FeedListResponse>('/feed', {
      params: normalizeFeedListQuery(query),
    })
    return response.data.items.map(normalizeFeedItem)
  },
  listAll: async (query?: FeedListQuery): Promise<FeedItem[]> => {
    const response = await apiClient.get<FeedListResponse>('/feed/all', {
      params: normalizeFeedListQuery(query),
    })
    return response.data.items.map(normalizeFeedItem)
  },
  deleteItem: async (feedId: string): Promise<FeedDeleteResponse> => {
    const response = await apiClient.delete<FeedDeleteResponse>(`/feed/${feedId}`)
    return response.data
  },
  createPost: async (payload: CreatePostPayload): Promise<FeedItem> => {
    const formData = new FormData()
    formData.append('type', 'post')
    if (payload.text?.trim()) {
      formData.append('text', payload.text.trim())
    }
    payload.media?.forEach((file) => formData.append('media[]', file))

    const response = await apiClient.post<FeedCreateResponse>('/feed', formData)
    return normalizeFeedItem(response.data.item)
  },
  createPoll: async (payload: CreatePollPayload): Promise<FeedItem> => {
    const formData = new FormData()
    formData.append('type', 'poll')
    formData.append('payload', JSON.stringify(payload))

    const response = await apiClient.post<FeedCreateResponse>('/feed', formData)
    return normalizeFeedItem(response.data.item)
  },
  createQuiz: async (payload: CreateQuizPayload): Promise<FeedItem> => {
    const formData = new FormData()
    formData.append('type', 'quiz')
    formData.append('payload', JSON.stringify(payload))

    const response = await apiClient.post<FeedCreateResponse>('/feed', formData)
    return normalizeFeedItem(response.data.item)
  },
  createArticle: async (payload: CreateArticlePayload): Promise<FeedItem> => {
    const formData = new FormData()
    formData.append('type', 'article')
    formData.append('payload', JSON.stringify(payload))

    const response = await apiClient.post<FeedCreateResponse>('/feed', formData)
    return normalizeFeedItem(response.data.item)
  },
  answerQuiz: async (payload: QuizAnswerPayload): Promise<QuizAnswerResult> => {
    const response = await apiClient.post<QuizAnswerResponse>('/feed/quiz/answer', payload)
    return response.data.result
  },
  listComments: async (feedId: string, order: FeedCommentsOrder): Promise<FeedComment[]> => {
    const response = await apiClient.get<FeedCommentListResponse | FeedComment[]>(
      `/feed/${feedId}/comments`,
      {
      params: { order },
      },
    )
    const items = Array.isArray(response.data)
      ? response.data
      : response.data.items ?? response.data.comments ?? []
    return items.map(normalizeComment)
  },
  createComment: async (
    feedId: string,
    payload: CreateFeedCommentPayload,
  ): Promise<FeedComment> => {
    const formData = new FormData()
    if (payload.text?.trim()) {
      formData.append('text', payload.text.trim())
    }
    if (payload.parentId) {
      formData.append('parentId', payload.parentId)
    }
    payload.media?.forEach((file) => formData.append('media[]', file))

    const response = await apiClient.post<FeedCommentCreateResponse | FeedComment>(
      `/feed/${feedId}/comments`,
      formData,
    )
    const comment = isFeedComment(response.data)
      ? response.data
      : response.data.comment ?? response.data.result ?? response.data.item

    if (!comment) {
      throw new Error('Сервер не вернул созданный комментарий')
    }

    return normalizeComment(comment)
  },
  deleteComment: async (commentId: string): Promise<FeedCommentDeleteResponse> => {
    const response = await apiClient.delete<FeedCommentDeleteResponse>(`/comments/${commentId}`)
    return response.data
  },
  toggleCommentReaction: async (
    commentId: string,
    payload: ToggleFeedCommentReactionPayload,
  ): Promise<FeedCommentReactionToggleResult> => {
    const response = await apiClient.post<FeedCommentReactionToggleResponse>(
      `/comments/${commentId}/reactions/toggle`,
      payload,
    )

    const normalized = normalizeCommentReactionToggleResult(
      response.data.result ??
        response.data.item ??
        response.data.data ??
        (response.data.commentId
          ? {
              commentId: response.data.commentId,
              reactions: response.data.reactions ?? [],
            }
          : null),
    )

    if (!normalized) {
      throw new Error('Сервер не вернул обновленные реакции комментария')
    }

    return normalized
  },
  listMedia: async (): Promise<FeedMediaResponse> => {
    const response = await apiClient.get<FeedMediaResponse>('/feed/media')
    return response.data
  },
}
