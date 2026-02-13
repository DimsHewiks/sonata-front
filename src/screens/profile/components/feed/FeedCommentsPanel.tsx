'use client'

import type { ChangeEvent, ReactNode, RefObject } from 'react'
import { RefreshCw, Send, X } from 'lucide-react'

import type { FeedCommentsOrder } from '@/features/feed/types'
import type { FeedComment } from '@/shared/types/profile'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { Button } from '@/ui/widgets/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/widgets/dropdown-menu'
import { ScrollArea } from '@/ui/widgets/scroll-area'
import { Separator } from '@/ui/widgets/separator'
import { Skeleton } from '@/ui/widgets/skeleton'
import { Textarea } from '@/ui/widgets/textarea'
import { FeedCommentItem } from '@/screens/profile/components/feed/FeedCommentItem'

interface ReplyTarget {
  id: string
  login: string
}

interface FeedCommentsPanelProps {
  mode: 'inline' | 'drawer'
  comments: FeedComment[]
  commentsLoading: boolean
  commentsError: string | null
  order: FeedCommentsOrder
  submitLoading: boolean
  submitError: string | null
  deleteError: string | null
  deleteLoadingIds: Record<string, boolean>
  collapsedReplyIds: Record<string, boolean>
  formText: string
  formFilesCount: number
  replyTarget: ReplyTarget | null
  composerRef: RefObject<HTMLTextAreaElement | null>
  fileInputRef: RefObject<HTMLInputElement | null>
  onOrderChange: (order: FeedCommentsOrder) => void
  onRefresh: () => void
  onReplyCancel: () => void
  onTextChange: (value: string) => void
  onOpenFiles: () => void
  onFilesChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: () => void
  onReply: (comment: FeedComment) => void
  onDelete: (commentId: string) => void
  onToggleReplies: (commentId: string) => void
  onClose?: () => void
}

const renderOrderLabel = (order: FeedCommentsOrder): string => {
  if (order === 'asc') {
    return 'Сначала старые'
  }

  return 'Сначала новые'
}

export const FeedCommentsPanel = ({
  mode,
  comments,
  commentsLoading,
  commentsError,
  order,
  submitLoading,
  submitError,
  deleteError,
  deleteLoadingIds,
  collapsedReplyIds,
  formText,
  formFilesCount,
  replyTarget,
  composerRef,
  fileInputRef,
  onOrderChange,
  onRefresh,
  onReplyCancel,
  onTextChange,
  onOpenFiles,
  onFilesChange,
  onSubmit,
  onReply,
  onDelete,
  onToggleReplies,
  onClose,
}: FeedCommentsPanelProps) => {
  const listHeightClass = mode === 'drawer' ? 'flex-1 min-h-0' : 'max-h-[420px]'

  const renderTree = (items: FeedComment[], depth = 0): ReactNode => {
    return items.map((comment) => (
      <FeedCommentItem
        key={comment.id}
        comment={comment}
        depth={depth}
        isDeleting={Boolean(deleteLoadingIds[comment.id])}
        repliesCount={comment.children.length}
        repliesCollapsed={Boolean(collapsedReplyIds[comment.id])}
        onReply={onReply}
        onDelete={onDelete}
        onToggleReplies={onToggleReplies}
      >
        {renderTree(comment.children, depth + 1)}
      </FeedCommentItem>
    ))
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {renderOrderLabel(order)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onOrderChange('desc')}>Сначала новые</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOrderChange('asc')}>Сначала старые</DropdownMenuItem>
            <DropdownMenuItem disabled>Популярные</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onRefresh} disabled={commentsLoading}>
            <RefreshCw className="h-4 w-4" />
            Обновить
          </Button>
          {onClose ? (
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Закрыть
            </Button>
          ) : null}
        </div>
      </div>

      <Separator />

      <ScrollArea className={listHeightClass}>
        <div className="space-y-3 pr-1">
          {commentsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : null}

          {!commentsLoading && commentsError ? (
            <Alert variant="destructive">
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{commentsError}</AlertDescription>
            </Alert>
          ) : null}

          {!commentsLoading && !commentsError && comments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Пока нет комментариев.
            </div>
          ) : null}

          {!commentsLoading && !commentsError && comments.length > 0 ? renderTree(comments) : null}
        </div>
      </ScrollArea>

      <Separator />

      <div className="space-y-2">
        {replyTarget ? (
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
            <span>Ответ пользователю @{replyTarget.login}</span>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onReplyCancel}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}

        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
        {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}

        <Textarea
          ref={composerRef}
          placeholder="Напишите комментарий"
          value={formText}
          onChange={(event) => onTextChange(event.target.value)}
          disabled={submitLoading}
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
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
            >
              Файлы
            </Button>
            {formFilesCount > 0 ? (
              <span className="text-xs text-muted-foreground">{formFilesCount} файл(ов)</span>
            ) : null}
          </div>

          <Button type="button" size="sm" onClick={onSubmit} disabled={submitLoading}>
            <Send className="h-4 w-4" />
            Отправить
          </Button>
        </div>
      </div>
    </div>
  )
}
