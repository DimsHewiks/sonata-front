'use client'

import { useEffect, useMemo, useState } from 'react'

import type { FeedArticle } from '@/shared/types/profile'
import type { ArticleDto } from '@/shared/types/article'
import { articlesApi } from '@/features/articles/api'
import { getApiErrorMessage } from '@/shared/api/errors'
import { getMediaUrl } from '@/shared/config/api'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { Button } from '@/ui/widgets/button'
import { SongRenderer } from '@/screens/articles/components/SongRenderer'
import { ArticleContentRenderer } from '@/screens/articles/components/ArticleContentRenderer'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/widgets/dialog'

interface ArticleDialogProps {
  article: FeedArticle | null
  onClose: () => void
}

export const ArticleDialog = ({ article, onClose }: ArticleDialogProps) => {
  const [articleData, setArticleData] = useState<ArticleDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transpose, setTranspose] = useState(0)
  const [showChords, setShowChords] = useState(true)
  const [notation, setNotation] = useState<'standard' | 'german'>('standard')

  const articleId = useMemo(() => {
    if (!article) {
      return null
    }
    const rawId = article.articleId ?? article.id
    if (rawId.startsWith('article-')) {
      return rawId.replace('article-', '')
    }
    return rawId
  }, [article])

  useEffect(() => {
    if (!articleId) {
      setArticleData(null)
      setError(null)
      setLoading(false)
      setTranspose(0)
      setShowChords(true)
      return
    }

    let isActive = true
    setLoading(true)
    setError(null)

    articlesApi
      .getById(articleId)
      .then((data) => {
        if (isActive) {
          setArticleData(data)
        }
      })
      .catch((fetchError) => {
        if (isActive) {
          setError(getApiErrorMessage(fetchError))
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [articleId])

  useEffect(() => {
    if (articleData?.chordsNotation) {
      setNotation(articleData.chordsNotation)
    }
  }, [articleData?.chordsNotation])

  const coverUrl = articleData?.cover?.relativePath
    ? getMediaUrl(articleData.cover.relativePath)
    : null
  const coverPositionY = articleData?.cover?.position?.y ?? 0.5

  return (
    <Dialog open={Boolean(article)} onOpenChange={onClose}>
      <DialogContent className="h-[85vh] max-w-[860px] overflow-hidden p-0">
        <div className="flex h-full min-h-0 flex-col">
          <div className="space-y-2 border-b border-border px-6 py-5">
            <DialogHeader className="space-y-1">
              <DialogTitle>{articleData?.title ?? article?.title ?? 'Статья'}</DialogTitle>
            </DialogHeader>
            {article?.author ? (
              <div className="text-xs text-muted-foreground">
                @{article.author.login} · {article.createdAt}
              </div>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {coverUrl ? (
              <div className="relative h-56 w-full overflow-hidden bg-muted">
                <img
                  src={coverUrl}
                  alt={articleData?.title ?? article?.title ?? 'Cover'}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: `50% ${coverPositionY * 100}%` }}
                />
              </div>
            ) : null}
            <div className="space-y-6 px-6 py-8">
              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>Ошибка</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              {loading ? (
                <div className="text-sm text-muted-foreground">Загружаем статью...</div>
              ) : null}
              {!loading && articleData?.type === 'text' ? (
                <ArticleContentRenderer
                  body={articleData.body || ''}
                  embeds={articleData.embeds || []}
                  className="space-y-6"
                />
              ) : null}
              {!loading && articleData?.type === 'song' ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setTranspose((prev) => Math.max(prev - 1, -12))}
                    >
                      Transpose -
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setTranspose((prev) => Math.min(prev + 1, 12))}
                    >
                      Transpose +
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={showChords ? 'default' : 'outline'}
                      onClick={() => setShowChords((prev) => !prev)}
                    >
                      {showChords ? 'Скрыть аккорды' : 'Показать аккорды'}
                    </Button>
                    <div className="flex items-center gap-1 rounded-md border border-border p-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={notation === 'standard' ? 'default' : 'ghost'}
                        onClick={() => setNotation('standard')}
                      >
                        Standard
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={notation === 'german' ? 'default' : 'ghost'}
                        onClick={() => setNotation('german')}
                      >
                        German
                      </Button>
                    </div>
                  </div>
                  <SongRenderer
                    body={articleData.body || ''}
                    notation={notation}
                    transpose={transpose}
                    showChords={showChords}
                  />
                </div>
              ) : null}
            </div>
          </div>
          <DialogFooter className="border-t border-border px-6 py-4">
            <Button onClick={onClose}>Закрыть</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
