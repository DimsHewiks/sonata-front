'use client'

import type { ReactNode } from 'react'
import { MoreHorizontal, Play, Reply, Trash2 } from 'lucide-react'

import { getMediaUrl } from '@/shared/config/api'
import { isVideoExtension } from '@/shared/lib/media'
import type { FeedComment } from '@/shared/types/profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/widgets/avatar'
import { Button } from '@/ui/widgets/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/widgets/dropdown-menu'

interface FeedCommentItemProps {
  comment: FeedComment
  depth: number
  isDeleting: boolean
  repliesCount: number
  repliesCollapsed: boolean
  onReply: (comment: FeedComment) => void
  onDelete: (commentId: string) => void
  onToggleReplies: (commentId: string) => void
  children?: ReactNode
}

const MAX_DEPTH = 3

export const FeedCommentItem = ({
  comment,
  depth,
  isDeleting,
  repliesCount,
  repliesCollapsed,
  onReply,
  onDelete,
  onToggleReplies,
  children,
}: FeedCommentItemProps) => {
  const avatarUrl = comment.author.avatar?.relative_path
    ? getMediaUrl(comment.author.avatar.relative_path)
    : undefined
  const visualDepth = Math.min(depth, MAX_DEPTH)

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(`https://sonata.ru/comments/${comment.id}`)
  }

  return (
    <div className="space-y-2" style={{ paddingLeft: visualDepth * 8 }}>
      <div className="rounded-lg border border-border bg-background p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={comment.author.name} />
              <AvatarFallback>{comment.author.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-semibold">{comment.author.name}</div>
              <div className="text-xs text-muted-foreground">
                @{comment.author.login} · {comment.createdAt}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => onReply(comment)}>
              <Reply className="h-3.5 w-3.5" />
              Ответить
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyLink}>Скопировать ссылку</DropdownMenuItem>
                <DropdownMenuItem>Пожаловаться</DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(comment.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {comment.text ? <p className="mt-2 text-sm">{comment.text}</p> : null}

        {comment.media?.length ? (
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {comment.media.map((file) => {
              const mediaUrl = getMediaUrl(file.relative_path)
              const isVideo = isVideoExtension(file.extension)

              return (
                <div
                  key={`${comment.id}-${file.relative_path}-${file.saved_name ?? file.original_name ?? 'media'}`}
                  className="relative aspect-square overflow-hidden rounded-md border border-border"
                >
                  {isVideo ? (
                    <>
                      <video
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        src={mediaUrl}
                      />
                      <div className="absolute inset-0 bg-black/35" />
                      <Play className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-white" />
                    </>
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="Комментарий"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              )
            })}
          </div>
        ) : null}

        {repliesCount > 0 ? (
          <div className="mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => onToggleReplies(comment.id)}
            >
              {repliesCollapsed
                ? `Показать ответы (${repliesCount})`
                : `Скрыть ответы (${repliesCount})`}
            </Button>
          </div>
        ) : null}
      </div>

      {!repliesCollapsed && repliesCount > 0 ? (
        <div className="space-y-2 border-l border-border pl-4">
          <div className="ml-[-10px] h-2 w-2 rounded-full bg-muted-foreground/50" />
          {children}
        </div>
      ) : null}
    </div>
  )
}
