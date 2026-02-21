'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { ArticleDto, ArticleEmbed, ArticleType, ChordsNotation } from '@/shared/types/article'
import { articlesApi, type UpdateArticlePayload } from '@/features/articles/api'
import { getApiErrorMessage } from '@/shared/api/errors'
import { getMediaUrl } from '@/shared/config/api'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import {
  Bold,
  Code2,
  Heading2,
  Image as ImageIcon,
  Italic,
  Lightbulb,
  Link2,
  List,
  Quote,
} from 'lucide-react'
import { Button } from '@/ui/widgets/button'
import { Card, CardContent } from '@/ui/widgets/card'
import { Input } from '@/ui/widgets/input'
import { Label } from '@/ui/widgets/label'
import { Textarea } from '@/ui/widgets/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/ui/widgets/tabs'
import { SongRenderer } from '@/screens/articles/components/SongRenderer'
import { ArticleContentRenderer } from '@/screens/articles/components/ArticleContentRenderer'
import { EmojiPickerPopover } from '@/ui/widgets/emoji-picker'

interface ArticleEditorPageProps {
  articleId: string
}

const IMAGE_EMBED_TOKEN = /@image\s+([a-zA-Z0-9_-]{6,})/gi

export const ArticleEditorPage = ({ articleId }: ArticleEditorPageProps) => {
  const router = useRouter()
  const [article, setArticle] = useState<ArticleDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [type, setType] = useState<ArticleType>('text')
  const [body, setBody] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [notation, setNotation] = useState<ChordsNotation>('standard')
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverPosition, setCoverPosition] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 })
  const [embeds, setEmbeds] = useState<ArticleEmbed[]>([])
  const [publishLoading, setPublishLoading] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'edit' | 'split' | 'preview'>('split')

  const titleRef = useRef<HTMLInputElement | null>(null)
  const excerptRef = useRef<HTMLTextAreaElement | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [isMobileView, setIsMobileView] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const media = window.matchMedia('(max-width: 767px)')
    const handleChange = () => {
      const nextIsMobile = media.matches
      setIsMobileView(nextIsMobile)
      if (nextIsMobile && viewMode === 'split') {
        setViewMode('edit')
      }
    }
    handleChange()
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [viewMode])
  const debounceRef = useRef<number | null>(null)
  const lastPayloadRef = useRef<string | null>(null)
  const isSyncingScroll = useRef(false)

  useEffect(() => {
    if (!articleId || articleId === 'undefined' || articleId === 'null') {
      setError('Не удалось определить ID статьи.')
      setLoading(false)
      return
    }

    let isActive = true
    setLoading(true)
    setError(null)

    articlesApi
      .getById(articleId)
      .then((data) => {
        if (!isActive) {
          return
        }
        setArticle(data)
        setTitle(data.title)
        setType(data.type)
        setBody(data.body || '')
        setExcerpt(data.excerpt || '')
        setNotation(data.chordsNotation ?? 'standard')
        setCoverMediaId(data.cover?.mediaId ?? null)
        setCoverPreview(data.cover?.relativePath ? getMediaUrl(data.cover.relativePath) : null)
        setCoverPosition(data.cover?.position ?? { x: 0.5, y: 0.5 })
        setEmbeds(data.embeds ?? [])
        lastPayloadRef.current = JSON.stringify({
          title: data.title,
          type: data.type,
          format: 'markdown',
          body: data.body || '',
          excerpt: data.excerpt || '',
          chordsNotation: data.type === 'song' ? data.chordsNotation ?? 'standard' : null,
          coverMediaId: data.cover?.mediaId ?? '',
          coverPosition: data.cover?.position ?? { x: 0.5, y: 0.5 },
          embeds: data.embeds ?? [],
        })
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

  const previewContent = useMemo(() => body, [body])

  const scheduleSave = useCallback(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(async () => {
      const payload: UpdateArticlePayload = {
        title: title.trim(),
        type,
        format: 'markdown',
        body,
        excerpt: excerpt.trim(),
        chordsNotation: type === 'song' ? notation : null,
        coverMediaId: coverMediaId ?? '',
        coverPosition,
        embeds: embeds.map((embed) => ({
          type: embed.type,
          mediaId: embed.mediaId,
          caption: embed.caption ?? '',
          position: embed.position ?? 'inline',
        })),
      }

      const payloadKey = JSON.stringify(payload)
      if (payloadKey === lastPayloadRef.current) {
        return
      }

      setSaving(true)
      setError(null)

      try {
        const updated = await articlesApi.update(articleId, payload)
        setArticle(updated)
        lastPayloadRef.current = payloadKey
        setLastSavedAt(new Date().toISOString())
      } catch (saveError) {
        setError(getApiErrorMessage(saveError))
      } finally {
        setSaving(false)
      }
    }, 900)
  }, [articleId, body, coverMediaId, coverPosition, embeds, excerpt, notation, title, type])

  useEffect(() => {
    if (!article) {
      return
    }

    scheduleSave()

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [article, scheduleSave])

  const handleInsert = (value: string) => {
    const textarea = bodyRef.current
    const currentValue = textarea?.value ?? body
    const selectionStart = textarea?.selectionStart ?? currentValue.length
    const selectionEnd = textarea?.selectionEnd ?? currentValue.length
    const nextValue =
      currentValue.slice(0, selectionStart) + value + currentValue.slice(selectionEnd)

    setBody(nextValue)
    setEmbeds((prev) => syncEmbedsWithBody(nextValue, prev))

    if (textarea) {
      requestAnimationFrame(() => {
        const cursor = selectionStart + value.length
        textarea.focus()
        textarea.setSelectionRange(cursor, cursor)
      })
    }
  }

  const insertEmoji = (
    ref: HTMLInputElement | HTMLTextAreaElement | null,
    currentValue: string,
    setValue: (next: string) => void,
    emoji: string,
  ) => {
    const selectionStart = ref?.selectionStart ?? currentValue.length
    const selectionEnd = ref?.selectionEnd ?? currentValue.length
    const nextValue =
      currentValue.slice(0, selectionStart) + emoji + currentValue.slice(selectionEnd)

    setValue(nextValue)

    if (ref) {
      requestAnimationFrame(() => {
        const cursor = selectionStart + emoji.length
        ref.focus()
        ref.setSelectionRange(cursor, cursor)
      })
    }
  }

  const handleWrap = (before: string, after: string = before, placeholder = '') => {
    const textarea = bodyRef.current
    const currentValue = textarea?.value ?? body
    const selectionStart = textarea?.selectionStart ?? currentValue.length
    const selectionEnd = textarea?.selectionEnd ?? currentValue.length
    const selected = currentValue.slice(selectionStart, selectionEnd)
    const content = selected.length === 0 && placeholder ? placeholder : selected
    const nextValue =
      currentValue.slice(0, selectionStart) +
      before +
      content +
      after +
      currentValue.slice(selectionEnd)

    setBody(nextValue)
    setEmbeds((prev) => syncEmbedsWithBody(nextValue, prev))

    if (textarea) {
      requestAnimationFrame(() => {
        if (selected.length === 0 && placeholder) {
          const start = selectionStart + before.length
          const end = start + placeholder.length
          textarea.focus()
          textarea.setSelectionRange(start, end)
          return
        }
        const cursor = selectionStart + before.length + content.length + after.length
        textarea.focus()
        textarea.setSelectionRange(cursor, cursor)
      })
    }
  }

  const handleCodeInsert = () => {
    const textarea = bodyRef.current
    const currentValue = textarea?.value ?? body
    const selectionStart = textarea?.selectionStart ?? currentValue.length
    const selectionEnd = textarea?.selectionEnd ?? currentValue.length
    const selected = currentValue.slice(selectionStart, selectionEnd)
    const isMultiline = selected.includes('\n')

    if (isMultiline || selected.length === 0) {
      const placeholder = selected.length === 0 ? 'код' : selected
      const block = `\n\`\`\`\n${placeholder}\n\`\`\`\n`
      const nextValue =
        currentValue.slice(0, selectionStart) + block + currentValue.slice(selectionEnd)
      setBody(nextValue)
      setEmbeds((prev) => syncEmbedsWithBody(nextValue, prev))

      if (textarea) {
        requestAnimationFrame(() => {
          const start = selectionStart + 4
          const end = start + placeholder.length
          textarea.focus()
          textarea.setSelectionRange(start, end)
        })
      }
      return
    }

    handleWrap('`', '`', 'код')
  }

  const handlePrefixLines = (prefix: string) => {
    const textarea = bodyRef.current
    const currentValue = textarea?.value ?? body
    const selectionStart = textarea?.selectionStart ?? currentValue.length
    const selectionEnd = textarea?.selectionEnd ?? currentValue.length
    const hasSelection = selectionEnd > selectionStart

    if (!hasSelection) {
      const needsNewline = selectionStart > 0 && currentValue[selectionStart - 1] !== '\n'
      const insertion = needsNewline ? `\n${prefix}` : prefix
      const nextValue =
        currentValue.slice(0, selectionStart) + insertion + currentValue.slice(selectionEnd)

      setBody(nextValue)
      setEmbeds((prev) => syncEmbedsWithBody(nextValue, prev))

      if (textarea) {
        requestAnimationFrame(() => {
          const cursor = selectionStart + insertion.length
          textarea.focus()
          textarea.setSelectionRange(cursor, cursor)
        })
      }

      return
    }

    const selected = currentValue.slice(selectionStart, selectionEnd)
    const prefixedSelected = selected
      .split('\n')
      .map((line) => `${prefix}${line}`)
      .join('\n')
    const nextValue =
      currentValue.slice(0, selectionStart) + prefixedSelected + currentValue.slice(selectionEnd)

    setBody(nextValue)
    setEmbeds((prev) => syncEmbedsWithBody(nextValue, prev))

    if (textarea) {
      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(
          selectionStart,
          selectionStart + prefixedSelected.length,
        )
      })
    }
  }


  const syncScroll = (
    source: HTMLElement,
    target: HTMLElement,
  ) => {
    if (isSyncingScroll.current) {
      return
    }

    const sourceMax = source.scrollHeight - source.clientHeight
    const targetMax = target.scrollHeight - target.clientHeight
    if (sourceMax <= 0 || targetMax <= 0) {
      return
    }

    const ratio = source.scrollTop / sourceMax
    isSyncingScroll.current = true
    target.scrollTop = ratio * targetMax
    window.requestAnimationFrame(() => {
      isSyncingScroll.current = false
    })
  }

  const handleCoverUpload = async (file: File | null) => {
    if (!file) {
      return
    }

    setError(null)
    setSaving(true)
    try {
      const response = await articlesApi.uploadCover(file)
      setCoverMediaId(response.media.mediaId)
      setCoverPreview(getMediaUrl(response.media.relativePath))
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError))
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (file: File | null) => {
    if (!file) {
      return
    }

    setError(null)
    setSaving(true)
    try {
      const response = await articlesApi.uploadMedia(file)
      const media = response.media
      setEmbeds((prev) => [
        ...prev,
        {
          type: 'image',
          mediaId: media.mediaId,
          caption: '',
          position: 'inline',
          relativePath: media.relativePath,
          extension: media.extension,
        },
      ])
      handleInsert(`@image ${media.mediaId}\n`)
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError))
    } finally {
      setSaving(false)
    }
  }

  const syncEmbedsWithBody = (nextBody: string, currentEmbeds: ArticleEmbed[]) => {
    if (currentEmbeds.length === 0) {
      return currentEmbeds
    }

    const ids = new Set<string>()
    const matcher = new RegExp(IMAGE_EMBED_TOKEN.source, IMAGE_EMBED_TOKEN.flags)
    let match: RegExpExecArray | null

    while ((match = matcher.exec(nextBody)) !== null) {
      ids.add(match[1].toLowerCase())
    }

    const nextEmbeds = currentEmbeds.filter((embed) => {
      if (!embed.mediaId) {
        return false
      }
      return ids.has(embed.mediaId.toLowerCase())
    })

    if (
      nextEmbeds.length === currentEmbeds.length &&
      nextEmbeds.every((embed, index) => embed === currentEmbeds[index])
    ) {
      return currentEmbeds
    }

    return nextEmbeds
  }

  const handlePublish = async () => {
    setPublishError(null)

    if (!title.trim()) {
      setPublishError('Заполните заголовок')
      return
    }
    if (body.trim().length < 20) {
      setPublishError('Минимум 20 символов в тексте')
      return
    }

    setPublishLoading(true)
    try {
      const result = await articlesApi.publish(articleId)
      setArticle((prev) =>
        prev ? { ...prev, status: result.status, publishedAt: result.publishedAt } : prev,
      )
    } catch (publishErr) {
      setPublishError(getApiErrorMessage(publishErr))
    } finally {
      setPublishLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl py-10 text-sm text-muted-foreground">
        Загружаем редактор...
      </div>
    )
  }

  if (error && !article) {
    return (
      <div className="mx-auto w-full max-w-4xl py-10">
        <Alert variant="destructive">
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Редактор статьи</h1>
          <div className="text-xs text-muted-foreground">
            {saving ? 'Сохраняем...' : lastSavedAt ? 'Сохранено' : 'Черновик'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Назад
          </Button>
          <Button type="button" onClick={handlePublish} disabled={publishLoading}>
            {publishLoading ? 'Публикуем...' : 'Опубликовать'}
          </Button>
        </div>
      </div>

      {publishError ? (
        <Alert variant="destructive">
          <AlertTitle>Ошибка публикации</AlertTitle>
          <AlertDescription>{publishError}</AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="article-title">Заголовок</Label>
              <EmojiPickerPopover
                onEmojiSelect={(emoji) =>
                  insertEmoji(titleRef.current, title, setTitle, emoji)
                }
              />
            </div>
            <Input
              id="article-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              ref={titleRef}
            />
          </div>
          <div className="space-y-2">
            <Label>Тип статьи</Label>
            <Tabs value={type} onValueChange={(value) => setType(value as ArticleType)}>
              <TabsList>
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="song">Song</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="article-excerpt">Короткое описание</Label>
              <EmojiPickerPopover
                onEmojiSelect={(emoji) =>
                  insertEmoji(excerptRef.current, excerpt, setExcerpt, emoji)
                }
              />
            </div>
            <Textarea
              id="article-excerpt"
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              rows={2}
              ref={excerptRef}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium">Обложка</div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" asChild>
                <label>
                  Загрузить
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleCoverUpload(event.target.files?.[0] ?? null)}
                  />
                </label>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCoverMediaId(null)
                  setCoverPreview(null)
                }}
              >
                Убрать
              </Button>
            </div>
          </div>
          {coverPreview ? (
            <>
              <div className="h-52 overflow-hidden rounded-xl border border-border bg-muted">
                <img
                  src={coverPreview}
                  alt="Cover"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: `${coverPosition.x * 100}% ${coverPosition.y * 100}%` }}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Горизонталь</div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(coverPosition.x * 100)}
                    onChange={(event) =>
                      setCoverPosition((prev) => ({
                        ...prev,
                        x: Number(event.target.value) / 100,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Вертикаль</div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(coverPosition.y * 100)}
                    onChange={(event) =>
                      setCoverPosition((prev) => ({
                        ...prev,
                        y: Number(event.target.value) / 100,
                      }))
                    }
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              Добавьте обложку, чтобы статья выглядела ярче.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-medium text-muted-foreground">Режим</div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'edit' ? 'default' : 'outline'}
            onClick={() => setViewMode('edit')}
          >
            Редактор
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'split' ? 'default' : 'outline'}
            onClick={() => setViewMode('split')}
            disabled={isMobileView}
          >
            Разделённый
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'preview' ? 'default' : 'outline'}
            onClick={() => setViewMode('preview')}
          >
            Превью
          </Button>
        </div>
      </div>

      <div className={viewMode === 'split' ? 'grid gap-6 lg:grid-cols-[1.1fr_0.9fr]' : 'space-y-6'}>
        {(viewMode === 'edit' || viewMode === 'split') ? (
          <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium">Содержимое</div>
              {type === 'song' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleInsert('@block verse ')}
                  >
                    @block
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleInsert('[]')}
                  >
                    [Chord]
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
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="text-emerald-600"
                    onClick={() => handleWrap('**', '**', 'текст')}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="text-purple-600"
                    onClick={() => handleWrap('*', '*', 'текст')}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="text-slate-600"
                    onClick={handleCodeInsert}
                  >
                    <Code2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="text-blue-600"
                    onClick={() => handlePrefixLines('> ')}
                  >
                    <Quote className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="text-amber-500"
                    onClick={() => handlePrefixLines('> 💡 ')}
                  >
                    <Lightbulb className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="text-orange-600"
                    onClick={() => handlePrefixLines('- ')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="text-indigo-600"
                    onClick={() => handlePrefixLines('## ')}
                  >
                    <Heading2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="text-blue-600"
                    onClick={() => handleWrap('[', '](https://)', 'ссылка')}
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="outline" className="text-rose-600" asChild>
                    <label>
                      <ImageIcon className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => handleImageUpload(event.target.files?.[0] ?? null)}
                      />
                    </label>
                  </Button>
                </div>
              )}
              <EmojiPickerPopover
                onEmojiSelect={(emoji) =>
                  insertEmoji(bodyRef.current, body, setBody, emoji)
                }
              />
            </div>
            {type === 'song' ? (
              <Textarea
                ref={bodyRef}
                value={body}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setBody(nextValue)
                  setEmbeds((prev) => syncEmbedsWithBody(nextValue, prev))
                }}
                onScroll={(event) => {
                  if (!previewRef.current) {
                    return
                  }
                  syncScroll(event.currentTarget, previewRef.current)
                }}
                rows={18}
                className="max-h-[60vh]"
                placeholder="@block verse Куплет 1\n[Em7]..."
              />
            ) : (
              <Textarea
                ref={bodyRef}
                value={body}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setBody(nextValue)
                  setEmbeds((prev) => syncEmbedsWithBody(nextValue, prev))
                }}
                onScroll={(event) => {
                  if (previewRef.current) {
                    syncScroll(event.currentTarget, previewRef.current)
                  }
                }}
                rows={18}
                className="max-h-[60vh]"
                placeholder="Текст статьи..."
              />
            )}
            {type === 'text' && embeds.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm font-medium">Подписи к фото</div>
                <div className="space-y-2">
                  {embeds
                    .filter((embed) => embed.type === 'image' && embed.mediaId)
                    .map((embed, index) => (
                      <div
                        key={embed.mediaId ?? index}
                        className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2"
                      >
                        {embed.relativePath ? (
                          <img
                            src={getMediaUrl(embed.relativePath)}
                            alt={embed.caption ?? 'Фото'}
                            className="h-10 w-10 rounded-md border border-border object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md border border-dashed border-border text-[10px] text-muted-foreground">
                            Нет фото
                          </div>
                        )}
                        <Input
                          value={embed.caption ?? ''}
                          onChange={(event) =>
                            setEmbeds((prev) =>
                              prev.map((item) =>
                                item.mediaId === embed.mediaId
                                  ? { ...item, caption: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Подпись"
                        />
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
        ) : null}

        {(viewMode === 'preview' || viewMode === 'split') ? (
          <Card>
            <CardContent className="flex h-[60vh] flex-col gap-3 p-6">
              <div className="text-sm font-medium">Превью</div>
              <div
                className="min-h-0 flex-1 overflow-y-auto pr-1"
                ref={previewRef}
                onScroll={(event) => {
                  if (!bodyRef.current) {
                    return
                  }
                  syncScroll(event.currentTarget, bodyRef.current)
                }}
              >
                {type === 'text' ? (
                  <ArticleContentRenderer
                    body={previewContent || ''}
                    embeds={embeds}
                    className="space-y-6"
                  />
                ) : (
                  <SongRenderer
                    body={previewContent}
                    notation={notation}
                    transpose={0}
                    showChords
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
