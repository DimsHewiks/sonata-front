'use client'

import type { ChangeEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle } from 'lucide-react'

import { useAuthStore } from '@/features/auth/store'
import { feedApi } from '@/features/feed/api'
import type { CreateFeedCommentPayload, FeedCommentsOrder } from '@/features/feed/types'
import { getApiErrorMessage, hasApiErrorDetail } from '@/shared/api/errors'
import type { FeedComment, PostAuthor } from '@/shared/types/profile'
import {
  FeedCommentsPanel,
  type FeedCommentsPanelActions,
  type FeedCommentsPanelAuthorPreview,
  type FeedCommentsPanelComposerState,
  type FeedCommentsPanelReplyTarget,
  type FeedCommentsPanelState,
} from '@/shared/components/feed/FeedCommentsPanel'
import { Badge } from '@/ui/widgets/badge'
import { Button } from '@/ui/widgets/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/ui/widgets/drawer'

interface FeedPostCommentsProps {
  feedId: string
  commentsCount: number
  onCommentCountChange: (delta: number) => void
}

interface RemoveCommentResult {
  items: FeedComment[]
  removedCount: number
  removedIds: Set<string>
}

const TEMP_COMMENT_PREFIX = 'temp-comment-'
const toTemporaryCommentId = (): string => {
  return `${TEMP_COMMENT_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const isTemporaryComment = (commentId: string): boolean => {
  return commentId.startsWith(TEMP_COMMENT_PREFIX)
}

const toAvatarExtension = (relativePath: string): string => {
  const cleanPath = relativePath.split('?')[0]
  const extension = cleanPath.split('.').pop()?.toLowerCase()
  if (!extension || extension.length > 8) {
    return 'jpg'
  }

  return extension
}

const toAuthorPreview = (name: string, login: string, avatarPath?: string | null): PostAuthor => {
  if (!avatarPath) {
    return {
      name,
      login,
      avatar: null,
    }
  }

  return {
    name,
    login,
    avatar: {
      relative_path: avatarPath,
      extension: toAvatarExtension(avatarPath),
    },
  }
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

  let changed = false
  const nextItems = items.map((item) => {
    if (item.id === parentId) {
      const children = order === 'asc' ? [...item.children, comment] : [comment, ...item.children]
      changed = true
      return { ...item, children }
    }

    const nextChildren = insertComment(item.children, comment, parentId, order)
    if (nextChildren === item.children) {
      return item
    }

    changed = true
    return {
      ...item,
      children: nextChildren,
    }
  })

  return changed ? nextItems : items
}

const replaceComment = (
  items: FeedComment[],
  targetId: string,
  replacement: FeedComment,
): FeedComment[] => {
  let changed = false
  const nextItems = items.map((item) => {
    if (item.id === targetId) {
      changed = true
      return replacement
    }

    const nextChildren = replaceComment(item.children, targetId, replacement)
    if (nextChildren === item.children) {
      return item
    }

    changed = true
    return {
      ...item,
      children: nextChildren,
    }
  })

  return changed ? nextItems : items
}

const updateComment = (
  items: FeedComment[],
  targetId: string,
  updater: (comment: FeedComment) => FeedComment,
): FeedComment[] => {
  let changed = false
  const nextItems = items.map((item) => {
    if (item.id === targetId) {
      changed = true
      return updater(item)
    }

    const nextChildren = updateComment(item.children, targetId, updater)
    if (nextChildren === item.children) {
      return item
    }

    changed = true
    return {
      ...item,
      children: nextChildren,
    }
  })

  return changed ? nextItems : items
}

const toTombstoneComment = (comment: FeedComment): FeedComment => {
  return {
    ...comment,
    isDeleted: true,
    deletedAt: comment.deletedAt ?? new Date().toISOString(),
    text: undefined,
    media: [],
    reactions: [],
  }
}

const removeComment = (items: FeedComment[], targetId: string): RemoveCommentResult => {
  const removedIds = new Set<string>()
  let removedCount = 0
  let changed = false
  const nextItems: FeedComment[] = []

  items.forEach((item) => {
    if (item.id === targetId) {
      removedIds.add(item.id)
      removedCount += 1
      changed = true

      if (item.children.length > 0) {
        nextItems.push(toTombstoneComment(item))
      }

      return
    }

    const nested = removeComment(item.children, targetId)
    if (nested.removedCount > 0) {
      nested.removedIds.forEach((id) => removedIds.add(id))
      removedCount += nested.removedCount
      changed = true

      nextItems.push({
        ...item,
        children: nested.items,
      })
      return
    }

    nextItems.push(item)
  })

  return {
    items: changed ? nextItems : items,
    removedCount,
    removedIds,
  }
}

const removeRecordKey = <T,>(record: Record<string, T>, key: string): Record<string, T> => {
  if (!(key in record)) {
    return record
  }

  const next = { ...record }
  delete next[key]
  return next
}

const removeRecordKeys = <T,>(record: Record<string, T>, keys: Set<string>): Record<string, T> => {
  if (keys.size === 0) {
    return record
  }

  let changed = false
  const next = { ...record }
  keys.forEach((key) => {
    if (!(key in next)) {
      return
    }

    changed = true
    delete next[key]
  })

  return changed ? next : record
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
  const authStatus = useAuthStore((state) => state.status)
  const authUser = useAuthStore((state) => state.user)

  const [inlineOpen, setInlineOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [comments, setComments] = useState<FeedComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [order, setOrder] = useState<FeedCommentsOrder>('desc')

  const [formText, setFormText] = useState('')
  const [formFiles, setFormFiles] = useState<File[]>([])
  const [replyTarget, setReplyTarget] = useState<FeedCommentsPanelReplyTarget | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoadingIds, setDeleteLoadingIds] = useState<Record<string, boolean>>({})
  const [collapsedReplyIds, setCollapsedReplyIds] = useState<Record<string, boolean>>({})
  const [reactionLoadingIds, setReactionLoadingIds] = useState<Record<string, boolean>>({})
  const [failedCommentPayloads, setFailedCommentPayloads] = useState<
    Record<string, CreateFeedCommentPayload>
  >({})
  const [sendingCommentIds, setSendingCommentIds] = useState<Record<string, boolean>>({})
  const [reactionError, setReactionError] = useState<string | null>(null)

  const composerRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isOpen = inlineOpen || drawerOpen

  const composerAuthor = useMemo<FeedCommentsPanelAuthorPreview | null>(() => {
    if (!authUser) {
      return null
    }

    return {
      name: authUser.name,
      login: authUser.login,
      avatarPath: authUser.avatarPath,
    }
  }, [authUser])

  const failedCommentIds = useMemo<Record<string, boolean>>(() => {
    return Object.keys(failedCommentPayloads).reduce<Record<string, boolean>>((acc, commentId) => {
      acc[commentId] = true
      return acc
    }, {})
  }, [failedCommentPayloads])

  const focusComposer = useCallback(() => {
    requestAnimationFrame(() => {
      composerRef.current?.focus()
      composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [])

  const loadComments = useCallback(async () => {
    setCommentsLoading(true)
    setCommentsError(null)

    try {
      const data = await feedApi.listComments(feedId, order)
      setComments(data)
      setReactionLoadingIds({})
      setFailedCommentPayloads({})
      setSendingCommentIds({})
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
      setReactionError(null)
      setReactionLoadingIds({})
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && !commentsLoading && !commentsError && comments.length === 0) {
      focusComposer()
    }
  }, [comments.length, commentsError, commentsLoading, focusComposer, isOpen])

  const handleCommentsClick = useCallback(() => {
    if (isMobileViewport()) {
      setDrawerOpen(true)
      return
    }

    setInlineOpen((prev) => !prev)
  }, [])

  const handleReply = useCallback((comment: FeedComment) => {
    setReplyTarget({
      id: comment.id,
      login: comment.author.login,
    })
    focusComposer()
  }, [focusComposer])

  const handleCreateComment = useCallback(async () => {
    if (authStatus !== 'authenticated') {
      setSubmitError('Чтобы оставить комментарий, войдите в аккаунт.')
      return
    }

    if (submitLoading) {
      return
    }

    const text = formText.trim()

    setSubmitError(null)
    setDeleteError(null)
    setReactionError(null)

    if (!text && formFiles.length === 0) {
      setSubmitError('Введите текст комментария или добавьте файл')
      focusComposer()
      return
    }

    const payload: CreateFeedCommentPayload = {
      text: text || undefined,
      media: formFiles,
      parentId: replyTarget?.id,
    }
    const temporaryId = toTemporaryCommentId()
    const optimisticAuthor = composerAuthor
      ? toAuthorPreview(composerAuthor.name, composerAuthor.login, composerAuthor.avatarPath)
      : toAuthorPreview('Вы', 'guest')

    const optimisticComment: FeedComment = {
      id: temporaryId,
      feedId,
      parentId: replyTarget?.id ?? null,
      author: optimisticAuthor,
      createdAt: 'Сейчас',
      text: text || undefined,
      reactions: [],
      children: [],
    }

    setComments((prev) => insertComment(prev, optimisticComment, replyTarget?.id ?? null, order))
    setSendingCommentIds((prev) => ({
      ...prev,
      [temporaryId]: true,
    }))
    onCommentCountChange(1)

    if (replyTarget) {
      setCollapsedReplyIds((prev) => ({
        ...prev,
        [replyTarget.id]: false,
      }))
    }

    setFormText('')
    setFormFiles([])
    setReplyTarget(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setSubmitLoading(true)

    try {
      const created = await feedApi.createComment(feedId, payload)
      setComments((prev) => replaceComment(prev, temporaryId, created))
      setFailedCommentPayloads((prev) => removeRecordKey(prev, temporaryId))
    } catch {
      setFailedCommentPayloads((prev) => ({
        ...prev,
        [temporaryId]: payload,
      }))
      onCommentCountChange(-1)
    } finally {
      setSendingCommentIds((prev) => removeRecordKey(prev, temporaryId))
      setSubmitLoading(false)
    }
  }, [
    authStatus,
    composerAuthor,
    feedId,
    focusComposer,
    formFiles,
    formText,
    onCommentCountChange,
    order,
    replyTarget,
    submitLoading,
  ])

  const handleRetryComment = useCallback(async (commentId: string) => {
    if (authStatus !== 'authenticated') {
      setSubmitError('Чтобы оставить комментарий, войдите в аккаунт.')
      return
    }

    const payload = failedCommentPayloads[commentId]
    if (!payload || sendingCommentIds[commentId]) {
      return
    }

    setSubmitError(null)
    setDeleteError(null)

    setSendingCommentIds((prev) => ({
      ...prev,
      [commentId]: true,
    }))
    setFailedCommentPayloads((prev) => removeRecordKey(prev, commentId))

    try {
      const created = await feedApi.createComment(feedId, payload)
      setComments((prev) => replaceComment(prev, commentId, created))
      if (payload.parentId) {
        setCollapsedReplyIds((prev) => ({
          ...prev,
          [payload.parentId]: false,
        }))
      }
      onCommentCountChange(1)
    } catch {
      setFailedCommentPayloads((prev) => ({
        ...prev,
        [commentId]: payload,
      }))
    } finally {
      setSendingCommentIds((prev) => removeRecordKey(prev, commentId))
    }
  }, [authStatus, failedCommentPayloads, feedId, onCommentCountChange, sendingCommentIds])

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (isTemporaryComment(commentId)) {
      if (sendingCommentIds[commentId]) {
        return
      }

      let removedCount = 0
      let removedIds = new Set<string>()
      const countedInStats = !failedCommentPayloads[commentId]

      setComments((prev) => {
        const result = removeComment(prev, commentId)
        removedCount = result.removedCount
        removedIds = result.removedIds
        return result.items
      })

      setFailedCommentPayloads((prev) => removeRecordKeys(prev, removedIds))
      setSendingCommentIds((prev) => removeRecordKeys(prev, removedIds))
      setReactionLoadingIds((prev) => removeRecordKeys(prev, removedIds))

      if (countedInStats && removedCount > 0) {
        onCommentCountChange(-removedCount)
      }

      if (replyTarget && removedIds.has(replyTarget.id)) {
        setReplyTarget(null)
      }

      return
    }

    if (authStatus !== 'authenticated') {
      setDeleteError('Чтобы удалить комментарий, войдите в аккаунт.')
      return
    }

    if (deleteLoadingIds[commentId] || sendingCommentIds[commentId]) {
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

      setFailedCommentPayloads((prev) => removeRecordKeys(prev, removedIds))
      setSendingCommentIds((prev) => removeRecordKeys(prev, removedIds))
      setReactionLoadingIds((prev) => removeRecordKeys(prev, removedIds))

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
  }, [
    authStatus,
    deleteLoadingIds,
    failedCommentPayloads,
    onCommentCountChange,
    replyTarget,
    sendingCommentIds,
  ])

  const handleFilesChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFormFiles(Array.from(event.target.files ?? []))
  }, [])

  const handleInsertEmoji = useCallback((emoji: string) => {
    const textarea = composerRef.current
    const currentValue = textarea?.value ?? formText
    const selectionStart = textarea?.selectionStart ?? currentValue.length
    const selectionEnd = textarea?.selectionEnd ?? currentValue.length
    const nextValue =
      currentValue.slice(0, selectionStart) + emoji + currentValue.slice(selectionEnd)

    setFormText(nextValue)

    if (textarea) {
      requestAnimationFrame(() => {
        const cursor = selectionStart + emoji.length
        textarea.focus()
        textarea.setSelectionRange(cursor, cursor)
      })
    }
  }, [formText])

  const handleToggleReplies = useCallback((commentId: string) => {
    setCollapsedReplyIds((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
  }, [])

  const handleToggleReaction = useCallback((commentId: string, emoji: string) => {
    if (authStatus !== 'authenticated') {
      setReactionError('Чтобы ставить реакции, войдите в аккаунт.')
      return
    }

    if (reactionLoadingIds[commentId]) {
      return
    }

    setReactionError(null)
    setReactionLoadingIds((prev) => ({
      ...prev,
      [commentId]: true,
    }))

    void feedApi
      .toggleCommentReaction(commentId, { emoji })
      .then((result) => {
        setComments((prev) =>
          updateComment(prev, commentId, (comment) => ({
            ...comment,
            reactions: result.reactions,
          })),
        )
      })
      .catch((error) => {
        if (hasApiErrorDetail(error, 'REACTION_LIMIT_EXCEEDED')) {
          setReactionError('Можно поставить не более 2 реакций на один комментарий.')
          return
        }

        setReactionError(getApiErrorMessage(error))
      })
      .finally(() => {
        setReactionLoadingIds((prev) => removeRecordKey(prev, commentId))
      })
  }, [authStatus, reactionLoadingIds])

  const handleRefresh = useCallback(() => {
    void loadComments()
  }, [loadComments])

  const handleSubmit = useCallback(() => {
    void handleCreateComment()
  }, [handleCreateComment])

  const handleDelete = useCallback((commentId: string) => {
    void handleDeleteComment(commentId)
  }, [handleDeleteComment])

  const handleRetry = useCallback((commentId: string) => {
    void handleRetryComment(commentId)
  }, [handleRetryComment])

  const panelState = useMemo<FeedCommentsPanelState>(() => {
    return {
      comments,
      commentsLoading,
      commentsError,
      order,
      submitLoading,
      submitError,
      deleteError,
      reactionError,
      canReact: authStatus === 'authenticated',
      deleteLoadingIds,
      reactionLoadingIds,
      sendingCommentIds,
      failedCommentIds,
      collapsedReplyIds,
    }
  }, [
    authStatus,
    collapsedReplyIds,
    comments,
    commentsError,
    commentsLoading,
    deleteError,
    deleteLoadingIds,
    failedCommentIds,
    order,
    reactionError,
    reactionLoadingIds,
    sendingCommentIds,
    submitError,
    submitLoading,
  ])

  const panelComposer = useMemo<FeedCommentsPanelComposerState>(() => {
    return {
      formText,
      formFilesCount: formFiles.length,
      replyTarget,
      composerAuthor,
      composerRef,
      fileInputRef,
    }
  }, [composerAuthor, formFiles.length, formText, replyTarget])

  const panelActions = useMemo<FeedCommentsPanelActions>(() => {
    return {
      onOrderChange: setOrder,
      onRefresh: handleRefresh,
      onReplyCancel: () => setReplyTarget(null),
      onTextChange: setFormText,
      onOpenFiles: () => fileInputRef.current?.click(),
      onFilesChange: handleFilesChange,
      onSubmit: handleSubmit,
      onInsertEmoji: handleInsertEmoji,
      onReply: handleReply,
      onDelete: handleDelete,
      onRetry: handleRetry,
      onToggleReaction: handleToggleReaction,
      onToggleReplies: handleToggleReplies,
    }
  }, [
    handleDelete,
    handleFilesChange,
    handleInsertEmoji,
    handleRefresh,
    handleReply,
    handleRetry,
    handleSubmit,
    handleToggleReaction,
    handleToggleReplies,
  ])

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
          <div className="mt-3 border-t border-border/70 pt-3">
            <FeedCommentsPanel
              mode="inline"
              state={panelState}
              composer={panelComposer}
              actions={panelActions}
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
              state={panelState}
              composer={panelComposer}
              actions={panelActions}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
