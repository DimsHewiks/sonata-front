import { apiClient } from '@/shared/api/client'
import type { ArticleDto, ArticleFormat, ArticleType } from '@/shared/types/article'

export interface ArticleCoverUploadResponse {
  media: {
    mediaId: string
    relativePath: string
    extension: string
  }
}

export interface CreateDraftPayload {
  title: string
  type: ArticleType
  format: ArticleFormat
}

export interface UpdateArticlePayload {
  title: string
  type: ArticleType
  format: ArticleFormat
  body?: string
  excerpt?: string
  chordsNotation?: 'standard' | 'german' | null
  coverMediaId?: string
  coverPosition?: { x: number; y: number }
  embeds?: { type: string; mediaId?: string; caption?: string | null; position?: 'inline' }[]
}

export interface PublishResponse {
  id: string
  status: 'published'
  publishedAt: string
  updatedAt: string
}

export const articlesApi = {
  uploadCover: async (file: File): Promise<ArticleCoverUploadResponse> => {
    const formData = new FormData()
    formData.append('cover', file)
    const response = await apiClient.post<ArticleCoverUploadResponse>('/articles/cover', formData)
    return response.data
  },
  uploadMedia: async (file: File): Promise<ArticleCoverUploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<ArticleCoverUploadResponse>('/articles/media', formData)
    return response.data
  },
  createDraft: async (payload: CreateDraftPayload): Promise<ArticleDto> => {
    const response = await apiClient.post<ArticleDto>('/articles', payload)
    return response.data
  },
  update: async (id: string, payload: UpdateArticlePayload): Promise<ArticleDto> => {
    const response = await apiClient.put<ArticleDto>(`/articles/${id}`, payload)
    return response.data
  },
  publish: async (id: string): Promise<PublishResponse> => {
    const response = await apiClient.post<PublishResponse>(`/articles/${id}/publish`)
    return response.data
  },
  getById: async (id: string): Promise<ArticleDto> => {
    const response = await apiClient.get<ArticleDto>(`/articles/${id}`)
    return response.data
  },
}
