'use client'

import { useMemo } from 'react'
import Link from 'next/link'

import type { FeedArticle } from '@/shared/types/profile'
import { getMediaUrl } from '@/shared/config/api'
import { Badge } from '@/ui/widgets/badge'
import { Button } from '@/ui/widgets/button'
import { CardContent } from '@/ui/widgets/card'
import { cn } from '@/lib/utils'

interface FeedArticleCardProps {
  article: FeedArticle
  onOpen: (article: FeedArticle) => void
  currentUser?: { login: string } | null
}

export const FeedArticleCard = ({ article, onOpen, currentUser }: FeedArticleCardProps) => {

  const coverUrl = useMemo(() => {
    if (!article.cover?.relative_path) {
      return null
    }
    return getMediaUrl(article.cover.relative_path)
  }, [article.cover?.relative_path])

  const coverPositionY = article.cover?.position?.y ?? 0.5

  const badgeLabel = article.articleType === 'song' ? 'Chords' : 'Text'
  const canEdit = Boolean(
    currentUser && article.author?.login && currentUser.login === article.author.login,
  )
  const articleId = useMemo(() => {
    const rawId = article.articleId ?? article.id
    return rawId.startsWith('article-') ? rawId.replace('article-', '') : rawId
  }, [article.articleId, article.id])

  return (
    <CardContent
      className="space-y-3"
      data-parallax-card
      data-parallax-factor="0.12"
      data-parallax-scale="1.2"
    >
      {coverUrl ? (
        <div className="relative h-44 overflow-hidden rounded-xl border border-border">
          <img
            src={coverUrl}
            alt={article.title}
            className="absolute inset-0 h-full w-full object-cover blur-sm"
            data-parallax-img
            style={{ objectPosition: `50% ${coverPositionY * 100}%` }}
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
            <div className="text-2xl font-semibold text-white drop-shadow sm:text-3xl">
              {article.title}
            </div>
          </div>
          <Badge
            className={cn(
              'absolute left-3 top-3 border-0 bg-white/90 text-[11px] text-foreground',
            )}
          >
            {badgeLabel}
          </Badge>
        </div>
      ) : null}
      {!coverUrl ? <div className="text-lg font-semibold">{article.title}</div> : null}
      {article.description ? (
        <p className="line-clamp-3 text-sm text-muted-foreground">{article.description}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{article.readTime}</span>
        <div className="flex items-center gap-2">
          {canEdit ? (
            <Button size="sm" variant="ghost" asChild>
              <Link href={`/articles/${articleId}/edit`}>Редактировать</Link>
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => onOpen(article)}>
            Читать
          </Button>
        </div>
      </div>
    </CardContent>
  )
}
