export type ArticleType = 'text' | 'song'
export type ArticleFormat = 'markdown'
export type ChordsNotation = 'standard' | 'german'

export interface ArticleCover {
  mediaId: string
  relativePath: string
  extension: string
  position?: { x: number; y: number } | null
}

export interface ArticleEmbed {
  type: string
  url?: string
  mediaId?: string
  caption?: string | null
  position?: 'inline'
  relativePath?: string
  extension?: string
  width?: number
  height?: number
}

export interface ArticleDto {
  id: string
  authorId: string
  title: string
  type: ArticleType
  format: ArticleFormat
  body: string
  excerpt: string | null
  status: 'draft' | 'published' | 'archived'
  cover: ArticleCover | null
  embeds: ArticleEmbed[]
  chordsNotation: ChordsNotation | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}
