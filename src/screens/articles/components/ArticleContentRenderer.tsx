'use client'

import { useMemo } from 'react'

import type { ArticleEmbed } from '@/shared/types/article'
import { getMediaUrl } from '@/shared/config/api'
import { Markdown } from '@/ui/widgets/markdown'

interface ArticleContentRendererProps {
  body: string
  embeds: ArticleEmbed[]
  className?: string
}

const IMAGE_TOKEN = /@image\s+([a-f0-9-]{6,})/gi

export const ArticleContentRenderer = ({ body, embeds, className }: ArticleContentRendererProps) => {
  const parts = useMemo(() => {
    const result: Array<{ type: 'markdown' | 'image'; value: string }> = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = IMAGE_TOKEN.exec(body)) !== null) {
      const [full, mediaId] = match
      const index = match.index
      if (index > lastIndex) {
        result.push({ type: 'markdown', value: body.slice(lastIndex, index) })
      }
      result.push({ type: 'image', value: mediaId.toLowerCase() })
      lastIndex = index + full.length
    }

    if (lastIndex < body.length) {
      result.push({ type: 'markdown', value: body.slice(lastIndex) })
    }

    return result
  }, [body])

  const embedMap = useMemo(() => {
    const map = new Map<string, ArticleEmbed>()
    embeds.forEach((embed) => {
      if (embed.mediaId) {
        map.set(embed.mediaId.toLowerCase(), embed)
      }
    })
    return map
  }, [embeds])

  return (
    <div className={className ?? 'space-y-6'}>
      {parts.map((part, index) => {
        if (part.type === 'markdown') {
          const content = part.value.trim()
          if (!content) {
            return null
          }
          return (
            <Markdown key={`md-${index}`} content={content} />
          )
        }

        const embed = embedMap.get(part.value)
        const src = embed?.relativePath ? getMediaUrl(embed.relativePath) : null

        return (
          <div key={`img-${index}`} className="space-y-2">
            {src ? (
              <img
                src={src}
                alt={embed?.caption ?? 'Image'}
                className="w-full rounded-md border border-border object-contain"
              />
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Изображение не найдено.
              </div>
            )}
            {embed?.caption ? (
              <div className="text-center text-xs text-muted-foreground">
                {embed.caption}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
