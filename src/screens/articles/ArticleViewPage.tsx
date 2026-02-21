'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import type { ArticleDto, ChordsNotation } from '@/shared/types/article'
import { articlesApi } from '@/features/articles/api'
import { getApiErrorMessage } from '@/shared/api/errors'
import { getMediaUrl } from '@/shared/config/api'
import { useAuthStore } from '@/features/auth/store'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { Button } from '@/ui/widgets/button'
import { SongRenderer } from '@/screens/articles/components/SongRenderer'
import { ArticleContentRenderer } from '@/screens/articles/components/ArticleContentRenderer'

interface ArticleViewPageProps {
  articleId: string
}

export const ArticleViewPage = ({ articleId }: ArticleViewPageProps) => {
  const user = useAuthStore((state) => state.user)
  const [articleRequest, setArticleRequest] = useState<{
    articleId: string
    article: ArticleDto | null
    error: string | null
  } | null>(null)
  const [transposeByArticleId, setTransposeByArticleId] = useState<Record<string, number>>({})
  const [showChordsByArticleId, setShowChordsByArticleId] = useState<Record<string, boolean>>({})
  const [notationByArticleId, setNotationByArticleId] = useState<Record<string, ChordsNotation>>({})

  useEffect(() => {
    let isActive = true

    articlesApi
      .getById(articleId)
      .then((data) => {
        if (isActive) {
          setArticleRequest({ articleId, article: data, error: null })
        }
      })
      .catch((fetchError) => {
        if (isActive) {
          setArticleRequest({
            articleId,
            article: null,
            error: getApiErrorMessage(fetchError),
          })
        }
      })

    return () => {
      isActive = false
    }
  }, [articleId])

  const isCurrentRequest = articleRequest?.articleId === articleId
  const loading = !isCurrentRequest
  const article = isCurrentRequest ? articleRequest?.article ?? null : null
  const error = isCurrentRequest ? articleRequest?.error ?? null : null

  const transpose = transposeByArticleId[articleId] ?? 0
  const showChords = showChordsByArticleId[articleId] ?? true
  const notation = notationByArticleId[articleId] ?? article?.chordsNotation ?? 'standard'

  const handleTranspose = useCallback((delta: number) => {
    setTransposeByArticleId((prev) => {
      const current = prev[articleId] ?? 0
      const next = Math.max(-12, Math.min(12, current + delta))
      if (next === current) {
        return prev
      }

      return {
        ...prev,
        [articleId]: next,
      }
    })
  }, [articleId])

  const handleToggleChords = useCallback(() => {
    setShowChordsByArticleId((prev) => ({
      ...prev,
      [articleId]: !(prev[articleId] ?? true),
    }))
  }, [articleId])

  const handleNotationChange = useCallback((nextNotation: ChordsNotation) => {
    setNotationByArticleId((prev) => {
      if (prev[articleId] === nextNotation) {
        return prev
      }

      return {
        ...prev,
        [articleId]: nextNotation,
      }
    })
  }, [articleId])

  const coverUrl = article?.cover?.relativePath
    ? getMediaUrl(article.cover.relativePath)
    : null
  const coverPositionY = article?.cover?.position?.y ?? 0.5
  const canEdit = Boolean(user && article?.authorId && user.uuid === article.authorId)
  const editHref = useMemo(() => `/articles/${articleId}/edit`, [articleId])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl py-10 text-sm text-muted-foreground">
        Загружаем статью...
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="mx-auto w-full max-w-4xl py-10">
        <Alert variant="destructive">
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error ?? 'Не удалось загрузить статью.'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[820px] space-y-8 px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold text-foreground">{article.title}</h1>
          <div className="text-sm text-muted-foreground">
            Обновлено: {article.updatedAt}
          </div>
        </div>
        {canEdit ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={editHref}>Редактировать</Link>
          </Button>
        ) : null}
      </div>

      {coverUrl ? (
        <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-muted shadow-sm">
          <img
            src={coverUrl}
            alt={article.title}
            className="h-full w-full object-cover"
            style={{ objectPosition: `50% ${coverPositionY * 100}%` }}
          />
        </div>
      ) : null}

      {article.type === 'text' ? (
        <ArticleContentRenderer
          body={article.body || ''}
          embeds={article.embeds || []}
          className="space-y-6"
        />
      ) : (
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
            body={article.body || ''}
            notation={notation}
            transpose={transpose}
            showChords={showChords}
          />
        </div>
      )}
    </div>
  )
}
