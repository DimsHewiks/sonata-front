'use client'

import type { FeedArticle } from '@/shared/types/profile'
import { Button } from '@/ui/widgets/button'
import { CardContent } from '@/ui/widgets/card'

interface FeedArticleCardProps {
  article: FeedArticle
  onOpen: (article: FeedArticle) => void
}

export const FeedArticleCard = ({ article, onOpen }: FeedArticleCardProps) => {
  return (
    <CardContent className="space-y-3">
      <div className="text-lg font-semibold">{article.title}</div>
      <p className="line-clamp-3 text-sm text-muted-foreground">{article.description}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{article.readTime}</span>
        <Button size="sm" variant="outline" onClick={() => onOpen(article)}>
          Читать
        </Button>
      </div>
    </CardContent>
  )
}
