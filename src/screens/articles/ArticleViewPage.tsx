'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import type { ArticleDto } from '@/shared/types/article'
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
  const [article, setArticle] = useState<ArticleDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transpose, setTranspose] = useState(0)
  const [showChords, setShowChords] = useState(true)
  const [notation, setNotation] = useState<'standard' | 'german'>('standard')

  useEffect(() => {
    let isActive = true
    setLoading(true)
    setError(null)

    articlesApi
      .getById(articleId)
      .then((data) => {
        if (isActive) {
          setArticle(data)
          setNotation(data.chordsNotation ?? 'standard')
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
