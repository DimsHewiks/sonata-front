'use client'

import Link from 'next/link'
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Flag, Link2, Loader2, MoreHorizontal, Play, Plus, Reply, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { getMediaUrl } from '@/shared/config/api'
import { isVideoExtension } from '@/shared/lib/media'
import type { FeedComment, FeedCommentReaction } from '@/shared/types/profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/widgets/avatar'
import { Button } from '@/ui/widgets/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/ui/widgets/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/widgets/dropdown-menu'

interface FeedCommentItemProps {
  comment: FeedComment
  depth: number
  canReact: boolean
  isDeleting: boolean
  isReactionLoading: boolean
  isSending: boolean
  isFailed: boolean
  repliesCount: number
  repliesCollapsed: boolean
  onReply: (comment: FeedComment) => void
  onDelete: (commentId: string) => void
  onRetry: (commentId: string) => void
  onToggleReaction: (commentId: string, emoji: string) => void
  onToggleReplies: (commentId: string) => void
  children?: ReactNode
}

const MAX_DEPTH = 3
const REACTION_SET = ['❤️', '🔥', '🎧', '🎸', '👏', '😅'] as const
const REACTION_PICKER_WIDTH = 280
const REACTION_PICKER_HEIGHT = 132
const REACTION_PICKER_GAP = 8

interface ReactionPickerPosition {
  left: number
  top: number
  placement: 'top' | 'bottom'
}

const isMobileViewport = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(max-width: 767px)').matches
}

const normalizeReactions = (
  reactions: FeedCommentReaction[] | undefined,
): FeedCommentReaction[] => {
  const merged = new Map<string, FeedCommentReaction>()

  ;(reactions ?? []).forEach((reaction) => {
    const emoji = reaction.emoji?.trim()
    if (!emoji) {
      return
    }

    const count = Number.isFinite(reaction.count) ? Math.max(0, Math.floor(reaction.count)) : 0
    const current = merged.get(emoji)
    if (!current) {
      merged.set(emoji, {
        emoji,
        count,
        active: Boolean(reaction.active),
      })
      return
    }

    current.count += count
    current.active = Boolean(current.active || reaction.active)
  })

  return Array.from(merged.values())
    .filter((reaction) => reaction.count > 0 || reaction.active)
    .sort((a, b) => b.count - a.count)
}

const FeedCommentItemComponent = ({
  comment,
  depth,
  canReact,
  isDeleting,
  isReactionLoading,
  isSending,
  isFailed,
  repliesCount,
  repliesCollapsed,
  onReply,
  onDelete,
  onRetry,
  onToggleReaction,
  onToggleReplies,
  children,
}: FeedCommentItemProps) => {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerDrawerOpen, setPickerDrawerOpen] = useState(false)
  const [animatedEmoji, setAnimatedEmoji] = useState<string | null>(null)
  const [pickerPosition, setPickerPosition] = useState<ReactionPickerPosition | null>(null)

  const pickerRef = useRef<HTMLDivElement | null>(null)
  const pickerTriggerRef = useRef<HTMLButtonElement | null>(null)

  const avatarUrl = comment.author.avatar?.relative_path
    ? getMediaUrl(comment.author.avatar.relative_path)
    : undefined
  const visualDepth = Math.min(depth, MAX_DEPTH)
  const isDeleted = Boolean(comment.isDeleted || comment.deletedAt)

  const reactions = useMemo(() => normalizeReactions(comment.reactions), [comment.reactions])
  const activeReactionCount = useMemo(() => {
    return reactions.reduce((count, reaction) => count + (reaction.active ? 1 : 0), 0)
  }, [reactions])
  const selectedReactionEmoji = useMemo(() => {
    return new Set(reactions.filter((reaction) => reaction.active).map((reaction) => reaction.emoji))
  }, [reactions])
  const isReactionSelectionLocked = canReact && activeReactionCount >= 2

  const updatePickerPosition = useCallback(() => {
    if (!pickerTriggerRef.current || typeof window === 'undefined') {
      return
    }

    const triggerRect = pickerTriggerRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const margin = 8

    const belowSpace = viewportHeight - triggerRect.bottom - margin
    const aboveSpace = triggerRect.top - margin
    const placeTop = belowSpace < REACTION_PICKER_HEIGHT && aboveSpace > belowSpace

    const left = Math.min(
      Math.max(triggerRect.left, margin),
      viewportWidth - REACTION_PICKER_WIDTH - margin,
    )
    const top = placeTop
      ? Math.max(margin, triggerRect.top - REACTION_PICKER_HEIGHT - REACTION_PICKER_GAP)
      : Math.min(
          viewportHeight - REACTION_PICKER_HEIGHT - margin,
          triggerRect.bottom + REACTION_PICKER_GAP,
        )

    setPickerPosition((previous) => {
      if (
        previous?.left === left &&
        previous.top === top &&
        previous.placement === (placeTop ? 'top' : 'bottom')
      ) {
        return previous
      }

      return {
        left,
        top,
        placement: placeTop ? 'top' : 'bottom',
      }
    })
  }, [])

  useEffect(() => {
    if (!pickerOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        pickerRef.current?.contains(target) ||
        pickerTriggerRef.current?.contains(target)
      ) {
        return
      }

      setPickerOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPickerOpen(false)
      }
    }

    const handleViewportUpdate = () => {
      updatePickerPosition()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleViewportUpdate)
    window.addEventListener('scroll', handleViewportUpdate, true)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleViewportUpdate)
      window.removeEventListener('scroll', handleViewportUpdate, true)
    }
  }, [pickerOpen, updatePickerPosition])

  useEffect(() => {
    if (!animatedEmoji) {
      return
    }

    const timerId = window.setTimeout(() => {
      setAnimatedEmoji(null)
    }, 170)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [animatedEmoji])

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(`https://sonata.ru/comments/${comment.id}`)
  }

  const handleAddReaction = (emoji: string) => {
    if (!canReact) {
      return
    }

    setAnimatedEmoji(emoji)
    onToggleReaction(comment.id, emoji)
    setPickerOpen(false)
    setPickerDrawerOpen(false)
  }

  const handleOpenReactionPicker = () => {
    if (!canReact) {
      return
    }

    if (isMobileViewport()) {
      setPickerDrawerOpen(true)
      return
    }

    setPickerOpen((prev) => {
      if (prev) {
        return false
      }

      updatePickerPosition()
      return true
    })
  }

  return (
    <div
      className="space-y-2 [--comment-indent:18px] sm:[--comment-indent:24px]"
      style={{ paddingInlineStart: `calc(${visualDepth} * var(--comment-indent))` }}
    >
      <div
        className={cn(
          'rounded-lg bg-muted/[0.04] px-2.5 py-2 sm:px-3 sm:py-3',
          isSending ? 'opacity-60' : undefined,
        )}
      >
        <div className="grid grid-cols-[28px,1fr] gap-2 sm:grid-cols-[32px,1fr] sm:gap-2.5">
          <Link href="/profile" className="mt-0.5 block h-7 w-7 sm:h-8 sm:w-8" aria-label="Открыть профиль">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
              <AvatarImage src={avatarUrl} alt={comment.author.name} />
              <AvatarFallback>{comment.author.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
          </Link>

          <div className="min-w-0">
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 text-[12px]">
                  <span className="text-[13px] font-semibold text-foreground sm:text-sm">
                    {comment.author.name}
                  </span>
                  <span className="text-muted-foreground">{comment.createdAt}</span>
                  {comment.editedAt && !isDeleted ? (
                    <span className="text-muted-foreground">изменено</span>
                  ) : null}
                  {isSending ? <Loader2 className="ml-1.5 h-3 w-3 animate-spin" /> : null}
                </div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">
                  <span>@{comment.author.login}</span>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                {!isDeleted ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 min-w-8 rounded-md px-2 text-xs"
                    onClick={() => onReply(comment)}
                  >
                    <Reply className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Ответить</span>
                  </Button>
                ) : null}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleCopyLink} className="text-sky-700 focus:text-sky-700">
                      <Link2 className="h-4 w-4" />
                      Скопировать ссылку
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-amber-700 focus:text-amber-700">
                      <Flag className="h-4 w-4" />
                      Пожаловаться
                    </DropdownMenuItem>
                    {!isDeleted ? (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(comment.id)}
                        disabled={isDeleting || isSending}
                      >
                        <Trash2 className="h-4 w-4" />
                        Удалить
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="mt-1.5 space-y-2">
              {isDeleted ? (
                <p className="text-[13px] leading-[1.5] text-muted-foreground sm:text-[14px]">
                  Комментарий удален
                </p>
              ) : comment.text ? (
                <p className="whitespace-pre-wrap break-words text-[13px] leading-[1.5] sm:text-[14px]">
                  {comment.text}
                </p>
              ) : null}

              {!isDeleted && comment.media?.length ? (
                <div className="grid grid-cols-2 gap-2">
                  {comment.media.map((file) => {
                    const mediaUrl = getMediaUrl(file.relative_path)
                    const isVideo = isVideoExtension(file.extension)

                    return (
                      <div
                        key={`${comment.id}-${file.relative_path}-${file.saved_name ?? file.original_name ?? 'media'}`}
                        className="relative h-[140px] overflow-hidden rounded-lg border border-border bg-muted/20 sm:h-[160px]"
                      >
                        {isVideo ? (
                          <>
                            <video className="h-full w-full object-cover" muted playsInline src={mediaUrl} />
                            <div className="absolute inset-0 bg-black/35" />
                            <Play className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-white" />
                          </>
                        ) : (
                          <img src={mediaUrl} alt="Комментарий" className="h-full w-full object-cover" />
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : null}

              {!isDeleted ? (
                <div className="relative">
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {reactions.map((reaction) => (
                      <button
                        key={`${comment.id}-${reaction.emoji}`}
                        type="button"
                        className={cn(
                          'flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2 text-xs transition',
                          'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
                          reaction.active
                            ? 'bg-primary/15 text-primary'
                            : 'text-muted-foreground hover:bg-muted/40',
                          animatedEmoji === reaction.emoji ? 'reaction-pop' : undefined,
                        )}
                        aria-label={`Реакция ${reaction.emoji}`}
                        onClick={() => handleAddReaction(reaction.emoji)}
                        disabled={
                          !canReact ||
                          isReactionLoading ||
                          (!reaction.active && isReactionSelectionLocked)
                        }
                      >
                        <span className="text-[14px] leading-none">{reaction.emoji}</span>
                        <span className="text-[12px] leading-none">{reaction.count}</span>
                      </button>
                    ))}

                    <button
                      ref={pickerTriggerRef}
                      type="button"
                      className={cn(
                        'flex h-6 w-8 shrink-0 items-center justify-center rounded-full text-xs transition',
                        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
                        'text-muted-foreground hover:bg-muted/40',
                      )}
                      aria-label="Добавить реакцию"
                      onClick={handleOpenReactionPicker}
                      disabled={!canReact || isReactionLoading || isReactionSelectionLocked}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : null}

              {isFailed && !isDeleted ? (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <span>Не отправилось -</span>
                  <button
                    type="button"
                    className="font-medium underline underline-offset-2"
                    onClick={() => onRetry(comment.id)}
                  >
                    Повторить
                  </button>
                </div>
              ) : null}
            </div>

            {repliesCount > 0 ? (
              <div className="mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-md px-2 text-xs text-muted-foreground"
                  onClick={() => onToggleReplies(comment.id)}
                >
                  {repliesCollapsed
                    ? `Показать ответы (${repliesCount})`
                    : `Скрыть ответы (${repliesCount})`}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {!repliesCollapsed && repliesCount > 0 ? (
        <div className="relative ml-2 border-l border-border/70 pl-4 sm:pl-5">
          <span className="absolute -left-[3px] top-3 h-1 w-1 rounded-full bg-muted-foreground/65" />
          <div className="space-y-2 sm:space-y-2.5">{children}</div>
        </div>
      ) : null}

      {pickerOpen && pickerPosition && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={pickerRef}
              style={{
                left: pickerPosition.left,
                top: pickerPosition.top,
              }}
              className={cn(
                'fixed z-[60] w-[280px] rounded-xl border border-border bg-popover p-2 shadow-lg',
                'animate-in fade-in-0 duration-150',
                pickerPosition.placement === 'top'
                  ? 'slide-in-from-bottom-1'
                  : 'slide-in-from-top-1',
              )}
            >
              <p className="px-1 pb-2 text-xs text-muted-foreground">Выберите реакцию</p>
              <div className="grid grid-cols-6 gap-1">
                {REACTION_SET.map((emoji) => (
                  <button
                    key={`${comment.id}-picker-${emoji}`}
                    type="button"
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-[10px] text-lg transition active:scale-[0.97]',
                      selectedReactionEmoji.has(emoji) ? 'bg-primary/15' : 'hover:bg-muted',
                    )}
                    onClick={() => handleAddReaction(emoji)}
                    disabled={
                      !canReact ||
                      isReactionLoading ||
                      (!selectedReactionEmoji.has(emoji) && isReactionSelectionLocked)
                    }
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}

      <Drawer open={pickerDrawerOpen} onOpenChange={setPickerDrawerOpen}>
        <DrawerContent className="h-[50vh] p-0 sm:hidden">
          <DrawerHeader className="border-b px-4 py-3 text-left">
            <DrawerTitle className="text-base">Реакции</DrawerTitle>
            <DrawerDescription>Выберите стикер для комментария</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 pt-3">
            <div className="grid grid-cols-5 gap-2">
              {REACTION_SET.map((emoji) => (
                <button
                  key={`${comment.id}-drawer-${emoji}`}
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-background text-lg transition hover:bg-muted active:scale-[0.97]"
                  onClick={() => handleAddReaction(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export const FeedCommentItem = memo(FeedCommentItemComponent, (prev, next) => {
  return (
    prev.comment === next.comment &&
    prev.depth === next.depth &&
    prev.canReact === next.canReact &&
    prev.isDeleting === next.isDeleting &&
    prev.isReactionLoading === next.isReactionLoading &&
    prev.isSending === next.isSending &&
    prev.isFailed === next.isFailed &&
    prev.repliesCount === next.repliesCount &&
    prev.repliesCollapsed === next.repliesCollapsed &&
    prev.onReply === next.onReply &&
    prev.onDelete === next.onDelete &&
    prev.onRetry === next.onRetry &&
    prev.onToggleReaction === next.onToggleReaction &&
    prev.onToggleReplies === next.onToggleReplies
  )
})

FeedCommentItem.displayName = 'FeedCommentItem'
