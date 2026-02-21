'use client'

import type { ChangeEvent, ReactNode, RefObject } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Paperclip, RefreshCw, Send, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { getMediaUrl } from '@/shared/config/api'
import type { FeedComment } from '@/shared/types/profile'
import type { FeedCommentsOrder } from '@/features/feed/types'
import { FeedCommentItem } from '@/shared/components/feed/FeedCommentItem'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/widgets/avatar'
import { Button } from '@/ui/widgets/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/widgets/dropdown-menu'
import { EmojiPickerPopover } from '@/ui/widgets/emoji-picker'
import { ScrollArea } from '@/ui/widgets/scroll-area'
import { Separator } from '@/ui/widgets/separator'
import { Skeleton } from '@/ui/widgets/skeleton'
import { Textarea } from '@/ui/widgets/textarea'

export interface FeedCommentsPanelReplyTarget {
  id: string
  login: string
}

export interface FeedCommentsPanelAuthorPreview {
  name: string
  login: string
  avatarPath?: string | null
}

export interface FeedCommentsPanelState {
  comments: FeedComment[]
  commentsLoading: boolean
  commentsError: string | null
  order: FeedCommentsOrder
  submitLoading: boolean
  submitError: string | null
  deleteError: string | null
  reactionError: string | null
  canReact: boolean
  deleteLoadingIds: Record<string, boolean>
  reactionLoadingIds: Record<string, boolean>
  sendingCommentIds: Record<string, boolean>
  failedCommentIds: Record<string, boolean>
  collapsedReplyIds: Record<string, boolean>
}

export interface FeedCommentsPanelComposerState {
  formText: string
  formFilesCount: number
  replyTarget: FeedCommentsPanelReplyTarget | null
  composerAuthor: FeedCommentsPanelAuthorPreview | null
  composerRef: RefObject<HTMLTextAreaElement | null>
  fileInputRef: RefObject<HTMLInputElement | null>
}

export interface FeedCommentsPanelActions {
  onOrderChange: (order: FeedCommentsOrder) => void
  onRefresh: () => void
  onReplyCancel: () => void
  onTextChange: (value: string) => void
  onOpenFiles: () => void
  onFilesChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: () => void
  onInsertEmoji: (emoji: string) => void
  onReply: (comment: FeedComment) => void
  onDelete: (commentId: string) => void
  onRetry: (commentId: string) => void
  onToggleReaction: (commentId: string, emoji: string) => void
  onToggleReplies: (commentId: string) => void
}

interface FeedCommentsPanelProps {
  mode: 'inline' | 'drawer'
  state: FeedCommentsPanelState
  composer: FeedCommentsPanelComposerState
  actions: FeedCommentsPanelActions
  onClose?: () => void
}

const renderOrderLabel = (order: FeedCommentsOrder): string => {
  if (order === 'asc') {
    return 'Сначала старые'
  }

  return 'Сначала новые'
}

const CommentsSkeleton = () => {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((index) => (
        <div key={index} className="rounded-lg bg-muted/25 px-2.5 py-2 sm:px-3 sm:py-3">
          <div className="grid grid-cols-[28px,1fr] gap-2 sm:grid-cols-[32px,1fr] sm:gap-2.5">
            <Skeleton className="h-7 w-7 rounded-full sm:h-8 sm:w-8" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-full max-w-[280px]" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-6 w-14 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
                <Skeleton className="h-6 w-9 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export const FeedCommentsPanel = ({
  mode,
  state,
  composer,
  actions,
  onClose,
}: FeedCommentsPanelProps) => {
  const [composerFocused, setComposerFocused] = useState(false)

  const {
    comments,
    commentsLoading,
    commentsError,
    order,
    submitLoading,
    submitError,
    deleteError,
    reactionError,
    canReact,
    deleteLoadingIds,
    reactionLoadingIds,
    sendingCommentIds,
    failedCommentIds,
    collapsedReplyIds,
  } = state

  const {
    formText,
    formFilesCount,
    replyTarget,
    composerAuthor,
    composerRef,
    fileInputRef,
  } = composer

  const {
    onOrderChange,
    onRefresh,
    onReplyCancel,
    onTextChange,
    onOpenFiles,
    onFilesChange,
    onSubmit,
    onInsertEmoji,
    onReply,
    onDelete,
    onRetry,
    onToggleReaction,
    onToggleReplies,
  } = actions

  const listHeightClass = mode === 'drawer' ? 'flex-1 min-h-0' : 'max-h-[440px]'
  const composerExpanded =
    composerFocused || Boolean(formText.trim()) || formFilesCount > 0 || Boolean(replyTarget)

  const composerAvatarUrl = composerAuthor?.avatarPath
    ? getMediaUrl(composerAuthor.avatarPath)
    : undefined
  const composerFallback = (composerAuthor?.name ?? 'S').slice(0, 2)

  useEffect(() => {
    const textarea = composerRef.current
    if (!textarea) {
      return
    }

    if (!composerExpanded) {
      textarea.style.height = '40px'
      textarea.style.overflowY = 'hidden'
      return
    }

    textarea.style.height = '0px'
    const scrollHeight = textarea.scrollHeight
    const nextHeight = Math.min(Math.max(scrollHeight, 84), 160)
    textarea.style.height = `${nextHeight}px`
    textarea.style.overflowY = scrollHeight > 160 ? 'auto' : 'hidden'
  }, [composerExpanded, composerRef, formText])

  const renderTree = (items: FeedComment[], depth = 0): ReactNode => {
    return items.map((comment) => (
      <FeedCommentItem
        key={comment.id}
        comment={comment}
        depth={depth}
        canReact={canReact}
        isDeleting={Boolean(deleteLoadingIds[comment.id])}
        isReactionLoading={Boolean(reactionLoadingIds[comment.id])}
        isSending={Boolean(sendingCommentIds[comment.id])}
        isFailed={Boolean(failedCommentIds[comment.id])}
        repliesCount={comment.children.length}
        repliesCollapsed={Boolean(collapsedReplyIds[comment.id])}
        onReply={onReply}
        onDelete={onDelete}
        onRetry={onRetry}
        onToggleReaction={onToggleReaction}
        onToggleReplies={onToggleReplies}
      >
        {renderTree(comment.children, depth + 1)}
      </FeedCommentItem>
    ))
  }

  const hasFormError = useMemo(() => {
    return Boolean(submitError || deleteError || reactionError)
  }, [deleteError, reactionError, submitError])

  return (
    <div className="flex h-full flex-col gap-3 py-3 sm:gap-4 sm:py-4">
      <div className="flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 rounded-lg px-3 text-xs sm:text-sm">
              {renderOrderLabel(order)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onOrderChange('desc')}>Сначала новые</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOrderChange('asc')}>Сначала старые</DropdownMenuItem>
            <DropdownMenuItem disabled>Популярные</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={commentsLoading}
            className="h-9 rounded-lg px-2.5"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Обновить</span>
          </Button>
          {onClose ? (
            <Button type="button" variant="ghost" size="sm" className="h-9 rounded-lg" onClick={onClose}>
              Закрыть
            </Button>
          ) : null}
        </div>
      </div>

      <Separator />

      <ScrollArea className={listHeightClass}>
        <div className="space-y-2 pr-1 sm:space-y-2.5">
          {commentsLoading ? <CommentsSkeleton /> : null}

          {!commentsLoading && commentsError ? (
            <Alert variant="destructive">
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{commentsError}</AlertDescription>
            </Alert>
          ) : null}

          {!commentsLoading && !commentsError && comments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/15 px-3 py-4 text-sm text-muted-foreground">
              Пока нет комментариев.
            </div>
          ) : null}

          {!commentsLoading && !commentsError && comments.length > 0 ? renderTree(comments) : null}
        </div>
      </ScrollArea>

      <div className="border-t border-border/60 pt-3 sm:pt-4">
        <div className="space-y-2.5 sm:space-y-3">
          {replyTarget ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
              <span>Ответ пользователю @{replyTarget.login}</span>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onReplyCancel}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : null}

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
          {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
          {reactionError ? <p className="text-sm text-destructive">{reactionError}</p> : null}

          <div className="grid grid-cols-[28px,1fr] gap-2 sm:grid-cols-[32px,1fr] sm:gap-2.5">
            <Avatar className="mt-1 h-7 w-7 sm:h-8 sm:w-8">
              <AvatarImage src={composerAvatarUrl} alt={composerAuthor?.name ?? 'Гость'} />
              <AvatarFallback>{composerFallback}</AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <Textarea
                ref={composerRef}
                placeholder="Написать комментарий…"
                value={formText}
                onChange={(event) => onTextChange(event.target.value)}
                onFocus={() => setComposerFocused(true)}
                onBlur={() => setComposerFocused(false)}
                disabled={submitLoading}
                className={cn(
                  'resize-none rounded-[10px] border border-border bg-background px-3 py-2 text-[13px] leading-[1.45] shadow-none transition-[height,min-height] duration-150',
                  'placeholder:text-muted-foreground/80 focus-visible:ring-1 focus-visible:ring-ring',
                  composerExpanded ? 'min-h-[84px]' : 'h-[38px] min-h-[38px] sm:h-10 sm:min-h-10',
                  hasFormError ? 'border-destructive/60' : undefined,
                )}
              />

              <div
                className={cn(
                  'items-center justify-between gap-2',
                  composerExpanded ? 'flex' : 'hidden',
                )}
                onMouseDown={(event) => event.preventDefault()}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    disabled={submitLoading}
                    onChange={onFilesChange}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onOpenFiles}
                    disabled={submitLoading}
                    className="h-8 rounded-lg px-2.5"
                    aria-label="Добавить файл"
                  >
                    <Paperclip className="h-4 w-4" />
                    <span className="hidden sm:inline">Файл</span>
                  </Button>

                  <EmojiPickerPopover onEmojiSelect={onInsertEmoji} disabled={submitLoading} />

                  {formFilesCount > 0 ? (
                    <span className="text-xs text-muted-foreground">{formFilesCount} файл(ов)</span>
                  ) : null}
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={onSubmit}
                  disabled={submitLoading}
                  className="h-8 rounded-lg px-3"
                >
                  <Send className="h-4 w-4" />
                  Отправить
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
