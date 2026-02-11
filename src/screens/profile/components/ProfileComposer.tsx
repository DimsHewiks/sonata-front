'use client'

import type { ChangeEvent } from 'react'
import { Image as ImageIcon, Play, Video as VideoIcon, X } from 'lucide-react'

import type { ProfileComposerProps } from '@/screens/profile/profile-components.types'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { Button } from '@/ui/widgets/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/widgets/card'
import { Textarea } from '@/ui/widgets/textarea'

export const ProfileComposer = ({
  composerText,
  composerError,
  composerLoading,
  attachments,
  imageInputRef,
  videoInputRef,
  composerRef,
  onTextChange,
  onAddFiles,
  onRemoveAttachment,
  onSubmit,
}: ProfileComposerProps) => {
  return (
    <Card ref={composerRef}>
      <CardHeader>
        <CardTitle className="text-base">Создать пост</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {composerError ? (
          <Alert variant="destructive">
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{composerError}</AlertDescription>
          </Alert>
        ) : null}
        <Textarea
          placeholder="Что нового?"
          value={composerText}
          onChange={(event) => onTextChange(event.target.value)}
          disabled={composerLoading}
        />
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onAddFiles(event.target.files, 'image')
            }
            disabled={composerLoading}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onAddFiles(event.target.files, 'video')
            }
            disabled={composerLoading}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => imageInputRef.current?.click()}
            disabled={composerLoading}
          >
            <ImageIcon className="h-4 w-4" />
            Фото
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => videoInputRef.current?.click()}
            disabled={composerLoading}
          >
            <VideoIcon className="h-4 w-4" />
            Видео
          </Button>
          <div className="ml-auto">
            <Button size="sm" onClick={onSubmit} disabled={composerLoading}>
              {composerLoading ? (
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
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7 rounded-full bg-white/80 opacity-0 transition group-hover:opacity-100"
                  onClick={() => onRemoveAttachment(item.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
