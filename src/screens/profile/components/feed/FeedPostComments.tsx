'use client'

import type { ChangeEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle } from 'lucide-react'

import { feedApi } from '@/features/feed/api'
import type { FeedCommentsOrder } from '@/features/feed/types'
import { getApiErrorMessage } from '@/shared/api/errors'
import type { FeedComment } from '@/shared/types/profile'
import { Badge } from '@/ui/widgets/badge'
import { Button } from '@/ui/widgets/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/ui/widgets/drawer'
import { FeedCommentsPanel } from '@/screens/profile/components/feed/FeedCommentsPanel'

interface FeedPostCommentsProps {
  feedId: string
  commentsCount: number
  onCommentCountChange: (delta: number) => void
}

interface ReplyTarget {
  id: string
  login: string
}

interface RemoveCommentResult {
  items: FeedComment[]
  removedCount: number
  removedIds: Set<string>
}

const countCommentNodes = (comment: FeedComment): number => {
  return 1 + comment.children.reduce((sum, child) => sum + countCommentNodes(child), 0)
}

const collectCommentIds = (comment: FeedComment, ids: Set<string>): void => {
  ids.add(comment.id)
  comment.children.forEach((child) => collectCommentIds(child, ids))
}

const insertComment = (
  items: FeedComment[],
  comment: FeedComment,
  parentId: string | null,
  order: FeedCommentsOrder,
): FeedComment[] => {
  if (!parentId) {
    return order === 'asc' ? [...items, comment] : [comment, ...items]
  }

  return items.map((item) => {
    if (item.id === parentId) {
      const children = order === 'asc' ? [...item.children, comment] : [comment, ...item.children]
      return { ...item, children }
    }

    return {
      ...item,
      children: insertComment(item.children, comment, parentId, order),
    }
  })
}

const removeComment = (items: FeedComment[], targetId: string): RemoveCommentResult => {
  const removedIds = new Set<string>()
  let removedCount = 0

  const filtered = items
    .filter((item) => {
      if (item.id !== targetId) {
        return true
      }

      removedCount += countCommentNodes(item)
      collectCommentIds(item, removedIds)
      return false
    })
    .map((item) => {
      const nested = removeComment(item.children, targetId)
      nested.removedIds.forEach((id) => removedIds.add(id))
      removedCount += nested.removedCount

      if (nested.removedCount === 0) {
        return item
      }

      return {
        ...item,
        children: nested.items,
      }
    })

  return {
    items: filtered,
    removedCount,
    removedIds,
  }
}

const isMobileViewport = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(max-width: 767px)').matches
}

export const FeedPostComments = ({
  feedId,
  commentsCount,
  onCommentCountChange,
}: FeedPostCommentsProps) => {
  const [inlineOpen, setInlineOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [comments, setComments] = useState<FeedComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [order, setOrder] = useState<FeedCommentsOrder>('desc')

  const [formText, setFormText] = useState('')
  const [formFiles, setFormFiles] = useState<File[]>([])
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoadingIds, setDeleteLoadingIds] = useState<Record<string, boolean>>({})
  const [collapsedReplyIds, setCollapsedReplyIds] = useState<Record<string, boolean>>({})

  const composerRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isOpen = inlineOpen || drawerOpen

  const loadComments = useCallback(async () => {
    setCommentsLoading(true)
    setCommentsError(null)

    try {
      const data = await feedApi.listComments(feedId, order)
      setComments(data)
    } catch (error) {
      setCommentsError(getApiErrorMessage(error))
    } finally {
      setCommentsLoading(false)
    }
  }, [feedId, order])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    void loadComments()
  }, [isOpen, loadComments])

  useEffect(() => {
    if (!isOpen) {
      setReplyTarget(null)
      setSubmitError(null)
      setDeleteError(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && !commentsLoading && !commentsError && comments.length === 0) {
      focusComposer()
    }
  }, [comments.length, commentsError, commentsLoading, isOpen])

  const focusComposer = () => {
    requestAnimationFrame(() => {
      composerRef.current?.focus()
      composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const handleCommentsClick = () => {
    if (isMobileViewport()) {
      setDrawerOpen(true)
      return
    }

    setInlineOpen((prev) => !prev)
  }

  const handleReply = (comment: FeedComment) => {
    setReplyTarget({
      id: comment.id,
      login: comment.author.login,
    })
    focusComposer()
  }

  const handleCreateComment = async () => {
    const text = formText.trim()

    setSubmitError(null)
    setDeleteError(null)

    if (!text && formFiles.length === 0) {
      setSubmitError('Введите текст комментария или добавьте файл')
      focusComposer()
      return
    }

    setSubmitLoading(true)

    try {
      const created = await feedApi.createComment(feedId, {
        text: text || undefined,
        media: formFiles,
        parentId: replyTarget?.id,
      })

      setComments((prev) => insertComment(prev, created, replyTarget?.id ?? null, order))
      if (replyTarget) {
        setCollapsedReplyIds((prev) => ({
          ...prev,
          [replyTarget.id]: false,
        }))
      }
      onCommentCountChange(1)
      setFormText('')
      setFormFiles([])
      setReplyTarget(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (deleteLoadingIds[commentId]) {
      return
    }

    setDeleteError(null)
    setDeleteLoadingIds((prev) => ({
      ...prev,
      [commentId]: true,
    }))

    try {
      const response = await feedApi.deleteComment(commentId)
      if (!response.deleted) {
        throw new Error('Не удалось удалить комментарий')
      }

      let removedCount = 0
      let removedIds = new Set<string>()

      setComments((prev) => {
        const result = removeComment(prev, commentId)
        removedCount = result.removedCount
        removedIds = result.removedIds
        return result.items
      })

      if (removedCount > 0) {
        onCommentCountChange(-removedCount)
      }

      if (replyTarget && removedIds.has(replyTarget.id)) {
        setReplyTarget(null)
      }
    } catch (error) {
      setDeleteError(getApiErrorMessage(error))
    } finally {
      setDeleteLoadingIds((prev) => {
        if (!prev[commentId]) {
          return prev
        }

        const next = { ...prev }
        delete next[commentId]
        return next
      })
    }
  }

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormFiles(Array.from(event.target.files ?? []))
  }

  const handleToggleReplies = (commentId: string) => {
    setCollapsedReplyIds((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={handleCommentsClick}>
        <MessageCircle className="h-4 w-4" />
        <span>Комментарии</span>
        <Badge variant="secondary" className="ml-1 min-w-5 justify-center px-1.5 py-0">
          {commentsCount}
        </Badge>
      </Button>

      {inlineOpen ? (
        <div className="order-last hidden w-full basis-full md:block">
          <div className="pt-2">
            <FeedCommentsPanel
              mode="inline"
              comments={comments}
              commentsLoading={commentsLoading}
              commentsError={commentsError}
              order={order}
              submitLoading={submitLoading}
              submitError={submitError}
              deleteError={deleteError}
              deleteLoadingIds={deleteLoadingIds}
              collapsedReplyIds={collapsedReplyIds}
              formText={formText}
              formFilesCount={formFiles.length}
              replyTarget={replyTarget}
              composerRef={composerRef}
              fileInputRef={fileInputRef}
              onOrderChange={setOrder}
              onRefresh={() => void loadComments()}
              onReplyCancel={() => setReplyTarget(null)}
              onTextChange={setFormText}
              onOpenFiles={() => fileInputRef.current?.click()}
              onFilesChange={handleFilesChange}
              onSubmit={() => void handleCreateComment()}
              onReply={handleReply}
              onDelete={(commentId) => void handleDeleteComment(commentId)}
              onToggleReplies={handleToggleReplies}
              onClose={() => setInlineOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="h-[88vh] p-0 md:hidden">
          <DrawerHeader className="border-b px-4 py-3 text-left">
            <DrawerTitle className="text-base">Комментарии</DrawerTitle>
            <DrawerDescription>Комментарии к посту</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden px-4 pb-4 pt-3">
            <FeedCommentsPanel
              mode="drawer"
              comments={comments}
              commentsLoading={commentsLoading}
              commentsError={commentsError}
              order={order}
              submitLoading={submitLoading}
              submitError={submitError}
              deleteError={deleteError}
              deleteLoadingIds={deleteLoadingIds}
              collapsedReplyIds={collapsedReplyIds}
              formText={formText}
              formFilesCount={formFiles.length}
              replyTarget={replyTarget}
              composerRef={composerRef}
              fileInputRef={fileInputRef}
              onOrderChange={setOrder}
              onRefresh={() => void loadComments()}
              onReplyCancel={() => setReplyTarget(null)}
              onTextChange={setFormText}
              onOpenFiles={() => fileInputRef.current?.click()}
              onFilesChange={handleFilesChange}
              onSubmit={() => void handleCreateComment()}
              onReply={handleReply}
              onDelete={(commentId) => void handleDeleteComment(commentId)}
              onToggleReplies={handleToggleReplies}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
