'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

import { articlesApi } from '@/features/articles/api'
import { getApiErrorMessage } from '@/shared/api/errors'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { Button } from '@/ui/widgets/button'
import { Input } from '@/ui/widgets/input'
import { Label } from '@/ui/widgets/label'
import { Tabs, TabsList, TabsTrigger } from '@/ui/widgets/tabs'
import { Textarea } from '@/ui/widgets/textarea'

interface ComposerArticleFormProps {
  onCreated: (item: unknown) => void
}

interface ArticleFormValues {
  title: string
  description: string
  type: 'text' | 'song'
}

const defaultValues: ArticleFormValues = {
  title: '',
  description: '',
  type: 'text',
}

export const ComposerArticleForm = ({ onCreated: _onCreated }: ComposerArticleFormProps) => {
  const router = useRouter()
  const { register, handleSubmit, reset, setValue, watch } = useForm<ArticleFormValues>({
    defaultValues,
  })
  const selectedType = watch('type')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = handleSubmit(async (values) => {
    setError(null)

    const title = values.title.trim()
    const description = values.description.trim()

    if (!title) {
      setError('Заполните заголовок')
      return
    }

    setLoading(true)

    try {
      const created = await articlesApi.createDraft({
        title,
        type: values.type,
        format: 'markdown',
      })

      if (!created?.id) {
        setError('Сервер не вернул ID статьи.')
        return
      }

      if (description) {
        await articlesApi.update(created.id, {
          title,
          type: values.type,
          format: 'markdown',
          excerpt: description,
        })
      }

      reset(defaultValues)
      router.push(`/articles/${encodeURIComponent(created.id)}/edit`)
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
      <div className="space-y-2">
        <Label>Тип статьи</Label>
        <Tabs value={selectedType} onValueChange={(value) => setValue('type', value as ArticleFormValues['type'])}>
          <TabsList>
            <TabsTrigger value="text">
              Text
            </TabsTrigger>
            <TabsTrigger value="song">
              Song
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <input type="hidden" {...register('type')} />
        <div className="text-xs text-muted-foreground">
          Тип влияет на доступные инструменты в редакторе.
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Готовим...' : 'Продолжить'}
        </Button>
      </div>
    </form>
  )
}
