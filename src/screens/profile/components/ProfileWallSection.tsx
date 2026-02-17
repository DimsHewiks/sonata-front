'use client'

import type { ForwardedRef } from 'react'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

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

    useImperativeHandle(ref, () => ({
      focusComposer: () => {
        setComposerType('post')
        composerRef.current?.scrollIntoView({ behavior: 'smooth' })
      },
    }))

    useEffect(() => {
      if (status !== 'authenticated') {
        setFeedError(null)
        setFeedLoading(false)
        setFeedItems([])
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

    const handleCreateItem = (item: FeedItem) => {
      setFeedItems((prev) => [item, ...prev])
      if (typeof window !== 'undefined' && item.type === 'post') {
        window.dispatchEvent(new Event('profile:media-refresh'))
      }
    }

    const handleDeleteItem = async (itemId: string) => {
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
    }

    const handleToggleLike = (postId: string) => {
      setLikedPosts((prev) => ({
        ...prev,
        [postId]: !prev[postId],
      }))
    }

    const handleCommentCountChange = (postId: string, delta: number) => {
      if (delta === 0) {
        return
      }

      setFeedItems((prev) =>
        prev.map((item) => {
          if (item.type !== 'post' || item.id !== postId) {
            return item
          }

          const currentComments = item.stats?.comments ?? 0
          const nextComments = Math.max(0, currentComments + delta)

          return {
            ...item,
            stats: {
              likes: item.stats?.likes ?? 0,
              comments: nextComments,
            },
          }
        }),
      )
    }

    const handleVotePoll = (pollId: string, optionIds: string[]) => {
      setFeedItems((prev) =>
        prev.map((item) => {
          if (item.type !== 'poll' || item.id !== pollId || item.userVoteIds.length) {
            return item
          }

          const validIds = item.options.map((option) => option.id)
          const uniqueIds = Array.from(new Set(optionIds)).filter((id) => validIds.includes(id))
          const currentTotal =
            item.totalVotes || item.options.reduce((sum, option) => sum + option.votes, 0)

          if (!uniqueIds.length) {
            return item
          }

          return {
            ...item,
            options: item.options.map((option) =>
              uniqueIds.includes(option.id)
                ? { ...option, votes: option.votes + 1 }
                : option,
            ),
            totalVotes: currentTotal + uniqueIds.length,
            userVoteIds: uniqueIds,
          }
        }),
      )
    }

    const applyQuizResult = (result: QuizAnswerResult) => {
      setFeedItems((prev) =>
        prev.map((item) => {
          if (item.type !== 'quiz' || item.id !== result.feedId) {
            return item
          }

          return {
            ...item,
            userAnswerId: result.userAnswerId,
            isCorrect: result.isCorrect,
            correctOptionId: result.correctOptionId,
          }
        }),
      )
    }

    const handleAnswerQuiz = async (quizId: string, optionId: string) => {
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
    }

    const focusComposer = () => {
      setComposerType('post')
      composerRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

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
          onCloseMedia={() => undefined}
          onClosePostMedia={() => setSelectedPostMedia(null)}
        />

        <ArticleDialog article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      </div>
    )
  },
)

ProfileWallSection.displayName = 'ProfileWallSection'
