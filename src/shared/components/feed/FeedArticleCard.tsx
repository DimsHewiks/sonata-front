'use client'

import { memo, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { BookOpen, Clock3, PencilLine } from 'lucide-react'

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

const FeedArticleCardComponent = ({ article, onOpen, currentUser }: FeedArticleCardProps) => {
  const coverRelativePath = article.cover?.relative_path ?? null
  const coverUrl = useMemo(() => {
    if (!coverRelativePath) {
      return null
    }
    return getMediaUrl(coverRelativePath)
  }, [coverRelativePath])

  const coverPositionY = article.cover?.position?.y ?? 0.5

  const badgeLabel = article.articleType === 'song' ? 'Chords' : 'Text'
  const canEdit = Boolean(
    currentUser && article.author?.login && currentUser.login === article.author.login,
  )
  const articleId = useMemo(() => {
    const rawId = article.articleId ?? article.id
    return rawId.startsWith('article-') ? rawId.replace('article-', '') : rawId
  }, [article.articleId, article.id])
  const handleOpen = useCallback(() => {
    onOpen(article)
  }, [article, onOpen])

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
            loading="lazy"
            decoding="async"
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
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5 text-primary/80" />
          {article.readTime}
        </span>
        <div className="flex items-center gap-2">
          {canEdit ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-amber-700 hover:bg-amber-100 hover:text-amber-700"
              asChild
            >
              <Link href={`/articles/${articleId}/edit`}>
                <PencilLine className="h-4 w-4" />
                Редактировать
              </Link>
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpen}
            className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
          >
            <BookOpen className="h-4 w-4" />
            Читать
          </Button>
        </div>
      </div>
    </CardContent>
  )
}

export const FeedArticleCard = memo(FeedArticleCardComponent)
FeedArticleCard.displayName = 'FeedArticleCard'
