'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { FeedArticle } from '@/shared/types/profile'
import type { ArticleDto, ChordsNotation } from '@/shared/types/article'
import { articlesApi } from '@/features/articles/api'
import { getApiErrorMessage } from '@/shared/api/errors'
import { getMediaUrl } from '@/shared/config/api'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { Button } from '@/ui/widgets/button'
import { SongRenderer } from '@/screens/articles/components/SongRenderer'
import { ArticleContentRenderer } from '@/screens/articles/components/ArticleContentRenderer'
import { Drawer, DrawerContent } from '@/ui/widgets/drawer'
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

interface ArticleViewState {
  articleId: string | null
  transpose: number
  showChords: boolean
  notation: ChordsNotation | null
}

const INITIAL_VIEW_STATE: ArticleViewState = {
  articleId: null,
  transpose: 0,
  showChords: true,
  notation: null,
}

const createViewState = (articleId: string): ArticleViewState => ({
  articleId,
  transpose: 0,
  showChords: true,
  notation: null,
})

export const ArticleDialog = ({ article, onClose }: ArticleDialogProps) => {
  const [articleRequest, setArticleRequest] = useState<{
    articleId: string
    data: ArticleDto | null
    error: string | null
  } | null>(null)
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.matchMedia('(max-width: 767px)').matches
  })
  const [viewState, setViewState] = useState<ArticleViewState>(INITIAL_VIEW_STATE)

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
    if (typeof window === 'undefined') {
      return
    }

    const media = window.matchMedia('(max-width: 767px)')
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileView(event.matches)
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!articleId) {
      return
    }

    let isActive = true

    articlesApi
      .getById(articleId)
      .then((data) => {
        if (isActive) {
          setArticleRequest({ articleId, data, error: null })
        }
      })
      .catch((fetchError) => {
        if (isActive) {
          setArticleRequest({
            articleId,
            data: null,
            error: getApiErrorMessage(fetchError),
          })
        }
      })

    return () => {
      isActive = false
    }
  }, [articleId])

  const isCurrentRequest = Boolean(articleId && articleRequest?.articleId === articleId)
  const loading = Boolean(articleId) && !isCurrentRequest
  const articleData = isCurrentRequest ? articleRequest?.data ?? null : null
  const error = isCurrentRequest ? articleRequest?.error ?? null : null

  const coverUrl = articleData?.cover?.relativePath
    ? getMediaUrl(articleData.cover.relativePath)
    : article?.cover?.relative_path
      ? getMediaUrl(article.cover.relative_path)
      : null
  const coverPositionY = articleData?.cover?.position?.y ?? article?.cover?.position?.y ?? 0.5
  const title = articleData?.title ?? article?.title ?? 'Статья'
  const excerpt = articleData?.excerpt ?? article?.description ?? null

  const isSameArticleView = Boolean(articleId && viewState.articleId === articleId)
  const transpose = isSameArticleView ? viewState.transpose : 0
  const showChords = isSameArticleView ? viewState.showChords : true
  const notation =
    (isSameArticleView ? viewState.notation : null) ?? articleData?.chordsNotation ?? 'standard'

  const handleTranspose = useCallback((delta: number) => {
    if (!articleId) {
      return
    }

    setViewState((prev) => {
      const current = prev.articleId === articleId ? prev : createViewState(articleId)
      const nextTranspose = Math.max(-12, Math.min(12, current.transpose + delta))

      if (nextTranspose === current.transpose) {
        return current
      }

      return {
        ...current,
        transpose: nextTranspose,
      }
    })
  }, [articleId])

  const handleToggleChords = useCallback(() => {
    if (!articleId) {
      return
    }

    setViewState((prev) => {
      const current = prev.articleId === articleId ? prev : createViewState(articleId)
      return {
        ...current,
        showChords: !current.showChords,
      }
    })
  }, [articleId])

  const handleNotationChange = useCallback((nextNotation: ChordsNotation) => {
    if (!articleId) {
      return
    }

    setViewState((prev) => {
      const current = prev.articleId === articleId ? prev : createViewState(articleId)
      if (current.notation === nextNotation) {
        return current
      }

      return {
        ...current,
        notation: nextNotation,
      }
    })
  }, [articleId])
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setArticleRequest(null)
      setViewState(INITIAL_VIEW_STATE)
      onClose()
    }
  }

  const content = (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {coverUrl ? (
          <div className="relative h-60 w-full overflow-hidden bg-muted sm:h-72">
            <img
              src={coverUrl}
              alt={title}
              className="h-full w-full scale-[1.02] object-cover blur-[3px]"
              style={{ objectPosition: `50% ${coverPositionY * 100}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
            <div className="absolute inset-x-0 bottom-[15px] p-4 sm:p-6">
              <DialogHeader className="max-w-2xl space-y-0.5 rounded-2xl p-3 text-left [backdrop-filter:none]">
                <DialogTitle className="text-2xl font-semibold leading-tight text-white sm:text-3xl">
                  {title}
                </DialogTitle>
                {excerpt ? (
                  <p className="text-sm leading-snug text-white/85">
                    {excerpt}
                  </p>
                ) : null}
                {article?.author ? (
                  <div className="text-xs leading-none text-white/70">
                    @{article.author.login} · {article.createdAt}
                  </div>
                ) : null}
              </DialogHeader>
            </div>
          </div>
        ) : (
          <div className="space-y-2 border-b border-border px-6 py-5">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-2xl sm:text-3xl">{title}</DialogTitle>
            </DialogHeader>
            {excerpt ? (
              <p className="text-sm text-muted-foreground">{excerpt}</p>
            ) : null}
            {article?.author ? (
              <div className="text-xs text-muted-foreground">
                @{article.author.login} · {article.createdAt}
              </div>
            ) : null}
          </div>
        )}
        <div
          className={cn(
            'space-y-6 bg-background px-6 pb-8',
            coverUrl
              ? 'relative z-10 -mt-6 rounded-t-[26px] border-t border-border/60 pt-4 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] sm:-mt-8'
              : 'pt-6',
          )}
        >
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
                  onClick={() => handleTranspose(-1)}
                >
                  Transpose -
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleTranspose(1)}
                >
                  Transpose +
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={showChords ? 'default' : 'outline'}
                  onClick={handleToggleChords}
                >
                  {showChords ? 'Скрыть аккорды' : 'Показать аккорды'}
                </Button>
                <div className="flex items-center gap-1 rounded-md border border-border p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={notation === 'standard' ? 'default' : 'ghost'}
                    onClick={() => handleNotationChange('standard')}
                  >
                    Standard
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={notation === 'german' ? 'default' : 'ghost'}
                    onClick={() => handleNotationChange('german')}
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
      <DialogFooter className="border-t border-border/70 px-6 py-4">
        <Button onClick={onClose}>Закрыть</Button>
      </DialogFooter>
    </div>
  )

  if (isMobileView) {
    return (
      <Drawer open={Boolean(article)} onOpenChange={handleOpenChange}>
        <DrawerContent
          className="h-[92vh] overflow-hidden rounded-t-2xl border-0 p-0"
          hideHandle={Boolean(coverUrl)}
        >
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={Boolean(article)} onOpenChange={handleOpenChange}>
      <DialogContent className="h-[85vh] max-w-[860px] overflow-hidden border-0 p-0">
        {content}
      </DialogContent>
    </Dialog>
  )
}
