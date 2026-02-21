'use client'

import type { ForwardedRef } from 'react'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

import type { AuthStatus, ProfileResponse } from '@/features/auth/types'
import { feedApi } from '@/features/feed/api'
import type { FeedArticle, FeedItem, PostMedia } from '@/shared/types/profile'
import type { ComposerType } from '@/screens/profile/profile-components.types'
import type { QuizAnswerResult } from '@/features/feed/types'
import { getApiErrorMessage } from '@/shared/api/errors'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { Skeleton } from '@/ui/widgets/skeleton'
import { ArticleDialog } from '@/screens/profile/components/ArticleDialog'
import { MediaDialogs } from '@/screens/profile/components/MediaDialogs'
import { ProfileComposer } from '@/screens/profile/components/ProfileComposer'
import { ProfileFeed } from '@/screens/profile/components/ProfileFeed'

export interface ProfileWallSectionHandle {
  focusComposer: () => void
}

interface ProfileWallSectionProps {
  status: AuthStatus
  currentUser: ProfileResponse
}

const noop = () => undefined

const FeedSkeleton = () => {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((index) => (
        <div key={index} className="rounded-xl border border-border p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

export const ProfileWallSection = forwardRef(
  ({ status, currentUser }: ProfileWallSectionProps, ref: ForwardedRef<ProfileWallSectionHandle>) => {
    const composerRef = useRef<HTMLDivElement | null>(null)
    const [composerType, setComposerType] = useState<ComposerType>('post')
    const [feedError, setFeedError] = useState<string | null>(null)
    const [feedLoading, setFeedLoading] = useState(false)
    const [feedItems, setFeedItems] = useState<FeedItem[]>([])
    const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({})
    const [selectedPostMedia, setSelectedPostMedia] = useState<PostMedia | null>(null)
    const [selectedArticle, setSelectedArticle] = useState<FeedArticle | null>(null)
    const [quizAnswerLoadingIds, setQuizAnswerLoadingIds] = useState<Record<string, boolean>>({})

    const focusComposer = useCallback(() => {
      setComposerType('post')
      composerRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useImperativeHandle(
      ref,
      () => ({
        focusComposer,
      }),
      [focusComposer],
    )

    useEffect(() => {
      if (status !== 'authenticated') {
        setFeedError(null)
        setFeedLoading(false)
        setFeedItems((prev) => (prev.length ? [] : prev))
        return
      }

      let isActive = true

      setFeedLoading(true)
      setFeedError(null)

      feedApi
        .list()
        .then((items) => {
          if (!isActive) {
            return
          }
          setFeedItems(items)
        })
        .catch((error) => {
          if (!isActive) {
            return
          }
          setFeedError(getApiErrorMessage(error))
        })
        .finally(() => {
          if (!isActive) {
            return
          }
          setFeedLoading(false)
        })

      return () => {
        isActive = false
      }
    }, [status])

    const handleCreateItem = useCallback((item: FeedItem) => {
      setFeedItems((prev) => [item, ...prev])
      if (typeof window !== 'undefined' && item.type === 'post') {
        window.dispatchEvent(new Event('profile:media-refresh'))
      }
    }, [])

    const handleDeleteItem = useCallback(async (itemId: string) => {
      try {
        const response = await feedApi.deleteItem(itemId)
        if (!response.deleted) {
          throw new Error('Не удалось удалить публикацию')
        }

        setFeedItems((prev) => prev.filter((item) => item.id !== response.feedId))
      } catch (error) {
        setFeedError(getApiErrorMessage(error))
        throw error
      }
    }, [])

    const handleToggleLike = useCallback((postId: string) => {
      setLikedPosts((prev) => ({
        ...prev,
        [postId]: !prev[postId],
      }))
    }, [])

    const handleCommentCountChange = useCallback((postId: string, delta: number) => {
      if (delta === 0) {
        return
      }

      setFeedItems((prev) => {
        const itemIndex = prev.findIndex((item) => item.type === 'post' && item.id === postId)

        if (itemIndex < 0) {
          return prev
        }

        const item = prev[itemIndex]
        if (item.type !== 'post') {
          return prev
        }
        const currentComments = item.stats?.comments ?? 0
        const nextComments = Math.max(0, currentComments + delta)

        if (nextComments === currentComments) {
          return prev
        }

        const next = [...prev]
        next[itemIndex] = {
          ...item,
          stats: {
            likes: item.stats?.likes ?? 0,
            comments: nextComments,
          },
        }

        return next
      })
    }, [])

    const handleVotePoll = useCallback((pollId: string, optionIds: string[]) => {
      setFeedItems((prev) => {
        const itemIndex = prev.findIndex((item) => item.type === 'poll' && item.id === pollId)
        if (itemIndex < 0) {
          return prev
        }

        const item = prev[itemIndex]
        if (item.type !== 'poll') {
          return prev
        }
        if (item.userVoteIds.length) {
          return prev
        }

        const validIds = new Set(item.options.map((option) => option.id))
        const uniqueIds = Array.from(new Set(optionIds)).filter((id) => validIds.has(id))
        if (!uniqueIds.length) {
          return prev
        }

        const selectedIds = new Set(uniqueIds)
        const currentTotal =
          item.totalVotes || item.options.reduce((sum, option) => sum + option.votes, 0)
        const next = [...prev]
        next[itemIndex] = {
          ...item,
          options: item.options.map((option) =>
            selectedIds.has(option.id)
              ? { ...option, votes: option.votes + 1 }
              : option,
          ),
          totalVotes: currentTotal + uniqueIds.length,
          userVoteIds: uniqueIds,
        }

        return next
      })
    }, [])

    const applyQuizResult = useCallback((result: QuizAnswerResult) => {
      setFeedItems((prev) => {
        const itemIndex = prev.findIndex((item) => item.type === 'quiz' && item.id === result.feedId)
        if (itemIndex < 0) {
          return prev
        }

        const item = prev[itemIndex]
        if (item.type !== 'quiz') {
          return prev
        }
        if (item.userAnswerId === result.userAnswerId && item.isCorrect === result.isCorrect) {
          return prev
        }

        const next = [...prev]
        next[itemIndex] = {
          ...item,
          userAnswerId: result.userAnswerId,
          isCorrect: result.isCorrect,
          correctOptionId: result.correctOptionId,
        }
        return next
      })
    }, [])

    const handleAnswerQuiz = useCallback(async (quizId: string, optionId: string) => {
      if (quizAnswerLoadingIds[quizId]) {
        return
      }

      const currentQuiz = feedItems.find(
        (item): item is Extract<FeedItem, { type: 'quiz' }> =>
          item.type === 'quiz' && item.id === quizId,
      )

      if (currentQuiz?.userAnswerId) {
        return
      }

      setQuizAnswerLoadingIds((prev) => ({
        ...prev,
        [quizId]: true,
      }))

      try {
        const result = await feedApi.answerQuiz({
          feedId: quizId,
          answerId: optionId,
        })

        applyQuizResult(result)
      } catch (error) {
        setFeedError(getApiErrorMessage(error))
      } finally {
        setQuizAnswerLoadingIds((prev) => {
          if (!prev[quizId]) {
            return prev
          }
          const next = { ...prev }
          delete next[quizId]
          return next
        })
      }
    }, [applyQuizResult, feedItems, quizAnswerLoadingIds])

    const handleClosePostMedia = useCallback(() => {
      setSelectedPostMedia(null)
    }, [])

    const handleCloseArticle = useCallback(() => {
      setSelectedArticle(null)
    }, [])

    return (
      <div className="space-y-6">
        <ProfileComposer
          activeType={composerType}
          composerRef={composerRef}
          onTypeChange={setComposerType}
          onItemCreated={handleCreateItem}
        />

        {feedError ? (
          <Alert variant="destructive">
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{feedError}</AlertDescription>
          </Alert>
        ) : null}

        {feedLoading ? (
          <FeedSkeleton />
        ) : (
          <ProfileFeed
            items={feedItems}
            likedPosts={likedPosts}
            currentUser={currentUser}
            onToggleLike={handleToggleLike}
            onDeleteItem={handleDeleteItem}
            onCommentCountChange={handleCommentCountChange}
            onSelectMedia={setSelectedPostMedia}
            onCreateFirstPost={focusComposer}
            onVotePoll={handleVotePoll}
            onAnswerQuiz={handleAnswerQuiz}
            onOpenArticle={setSelectedArticle}
            quizAnswerLoadingIds={quizAnswerLoadingIds}
          />
        )}

        <MediaDialogs
          selectedMedia={null}
          selectedPostMedia={selectedPostMedia}
          onCloseMedia={noop}
          onClosePostMedia={handleClosePostMedia}
        />

        <ArticleDialog article={selectedArticle} onClose={handleCloseArticle} />
      </div>
    )
  },
)

ProfileWallSection.displayName = 'ProfileWallSection'
