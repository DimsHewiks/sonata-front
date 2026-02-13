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
  FeedCommentsOrder,
  FeedCreateResponse,
  FeedDeleteResponse,
  FeedListResponse,
  QuizAnswerPayload,
  QuizAnswerResponse,
  QuizAnswerResult,
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
  return {
    ...comment,
    children: (comment.children ?? []).map(normalizeComment),
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

export const feedApi = {
  list: async (): Promise<FeedItem[]> => {
    const response = await apiClient.get<FeedListResponse>('/feed')
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
}
