'use client'

import type { ChangeEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Image as ImageIcon, Play, Video as VideoIcon, X } from 'lucide-react'
import { useForm } from 'react-hook-form'

import type { ComposerAttachment, FeedItem, MediaType } from '@/shared/types/profile'
import { feedApi } from '@/features/feed/api'
import { getApiErrorMessage } from '@/shared/api/errors'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { Button } from '@/ui/widgets/button'
import { Textarea } from '@/ui/widgets/textarea'

interface ComposerPostFormProps {
  onCreated: (item: FeedItem) => void
}

interface PostFormValues {
  text: string
}

const createId = (): string => {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const ComposerPostForm = ({ onCreated }: ComposerPostFormProps) => {
  const { register, handleSubmit, reset } = useForm<PostFormValues>({
    defaultValues: { text: '' },
  })
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([])
  const attachmentsRef = useRef<ComposerAttachment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)

  const syncAttachments = (next: ComposerAttachment[]) => {
    attachmentsRef.current = next
    setAttachments(next)
  }

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    }
  }, [])

  const handleAddFiles = (files: FileList | null, type: MediaType) => {
    if (!files?.length) {
      return
    }

    setError(null)

    const newItems = Array.from(files).map((file) => ({
      id: createId(),
      type,
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    syncAttachments([...attachmentsRef.current, ...newItems])
  }

  const handleRemoveAttachment = (id: string) => {
    const target = attachmentsRef.current.find((item) => item.id === id)
    if (target) {
      URL.revokeObjectURL(target.previewUrl)
    }

    syncAttachments(attachmentsRef.current.filter((item) => item.id !== id))
  }

  const onSubmit = handleSubmit(async ({ text }) => {
    setError(null)

    const trimmedText = text.trim()
    if (!trimmedText && attachmentsRef.current.length === 0) {
      setError('Добавьте текст или медиа')
      return
    }

    setLoading(true)

    try {
      const createdItem = await feedApi.createPost({
        text: trimmedText || undefined,
        media: attachmentsRef.current.map((item) => item.file),
      })

      onCreated(createdItem)
      attachmentsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      syncAttachments([])
      reset({ text: '' })
    } catch (postError) {
      setError(getApiErrorMessage(postError))
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
      <Textarea
        placeholder="Что нового?"
        {...register('text')}
        disabled={loading}
      />
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            handleAddFiles(event.target.files, 'image')
          }
          disabled={loading}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            handleAddFiles(event.target.files, 'video')
          }
          disabled={loading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => imageInputRef.current?.click()}
          disabled={loading}
        >
          <ImageIcon className="h-4 w-4" />
          Фото
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => videoInputRef.current?.click()}
          disabled={loading}
        >
          <VideoIcon className="h-4 w-4" />
          Видео
        </Button>
        <div className="ml-auto">
          <Button size="sm" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Публикуем...
              </>
            ) : (
              'Опубликовать'
            )}
          </Button>
        </div>
      </div>
      {attachments.length ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {attachments.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border"
            >
              {item.type === 'image' ? (
                <img
                  src={item.previewUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <video
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    src={item.previewUrl}
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <Play className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-white" />
                </>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7 rounded-full bg-white/80 opacity-0 transition group-hover:opacity-100"
                onClick={() => handleRemoveAttachment(item.id)}
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </form>
  )
}
