'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

import type { FeedItem } from '@/shared/types/profile'
import { feedApi } from '@/features/feed/api'
import { getApiErrorMessage } from '@/shared/api/errors'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { Button } from '@/ui/widgets/button'
import { Input } from '@/ui/widgets/input'
import { Label } from '@/ui/widgets/label'
import { Textarea } from '@/ui/widgets/textarea'

interface ComposerArticleFormProps {
  onCreated: (item: FeedItem) => void
}

interface ArticleFormValues {
  title: string
  description: string
}

const defaultValues: ArticleFormValues = {
  title: '',
  description: '',
}

export const ComposerArticleForm = ({ onCreated }: ComposerArticleFormProps) => {
  const { register, handleSubmit, reset } = useForm<ArticleFormValues>({
    defaultValues,
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = handleSubmit(async (values) => {
    setError(null)

    const title = values.title.trim()
    const description = values.description.trim()

    if (!title || !description) {
      setError('Заполните заголовок и описание')
      return
    }

    setLoading(true)

    try {
      const createdItem = await feedApi.createArticle({
        title,
        description,
      })

      onCreated(createdItem)
      reset(defaultValues)
    } catch (articleError) {
      setError(getApiErrorMessage(articleError))
    } finally {
      setLoading(false)
    }
  })

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="article-title">Заголовок</Label>
        <Input id="article-title" {...register('title')} disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="article-description">Короткое описание</Label>
        <Textarea id="article-description" {...register('description')} disabled={loading} />
      </div>
      <Alert>
        <AlertTitle>Редактор статьи будет позже</AlertTitle>
        <AlertDescription>
          Пока доступен только базовый шаблон для черновика.
        </AlertDescription>
      </Alert>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Готовим...' : 'Продолжить'}
        </Button>
      </div>
    </form>
  )
}
