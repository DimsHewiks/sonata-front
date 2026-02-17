'use client'

import { useEffect, useRef } from 'react'

import type { ProfileFeedProps } from '@/screens/profile/profile-components.types'
import { Button } from '@/ui/widgets/button'
import { Card, CardContent } from '@/ui/widgets/card'
import { FeedArticleCard } from '@/screens/profile/components/feed/FeedArticleCard'
import { FeedHeader } from '@/screens/profile/components/feed/FeedHeader'
import { FeedPollCard } from '@/screens/profile/components/feed/FeedPollCard'
import { FeedPostCard } from '@/screens/profile/components/feed/FeedPostCard'
import { FeedQuizCard } from '@/screens/profile/components/feed/FeedQuizCard'

export const ProfileFeed = ({
  items,
  likedPosts,
  currentUser,
  onToggleLike,
  onDeleteItem,
  onCommentCountChange,
  onSelectMedia,
  onCreateFirstPost,
  onVotePoll,
  onAnswerQuiz,
  onOpenArticle,
  quizAnswerLoadingIds,
}: ProfileFeedProps) => {
  const feedRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!feedRef.current) {
      return
    }

    let rafId: number | null = null

    const updateParallax = () => {
      const container = feedRef.current
      if (!container) {
        return
      }

      const cards = container.querySelectorAll<HTMLElement>('[data-parallax-card]')
      const viewportMid = window.innerHeight / 2

      cards.forEach((card) => {
        const img = card.querySelector<HTMLImageElement>('[data-parallax-img]')
        if (!img) {
          return
        }

        const rect = card.getBoundingClientRect()
        const elementMid = rect.top + rect.height / 2
        const factor = Number(card.dataset.parallaxFactor ?? '0.12')
        const scale = Number(card.dataset.parallaxScale ?? '1.2')
        const offset = (viewportMid - elementMid) * factor
        const maxShift = (rect.height * (scale - 1)) / 2
        const clampedOffset = Math.max(-maxShift, Math.min(maxShift, offset))

        img.style.transform = `translate3d(0, ${clampedOffset}px, 0) scale(${scale})`
      })
    }

    const onScroll = () => {
      if (rafId !== null) {
        return
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        updateParallax()
      })
    }

    updateParallax()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [items.length])
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
          <p className="text-sm text-muted-foreground">Пока нет публикаций</p>
          <Button size="sm" onClick={onCreateFirstPost}>
            Создать первую публикацию
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div ref={feedRef} className="space-y-4">
      {items.map((item) => (
        <Card key={item.id}>
          <FeedHeader
            itemId={item.id}
            type={item.type}
            author={item.author}
            createdAt={item.createdAt}
            onDelete={onDeleteItem}
          />
          {item.type === 'post' ? (
            <FeedPostCard
              post={item}
              liked={Boolean(likedPosts[item.id])}
              onToggleLike={onToggleLike}
              onCommentCountChange={onCommentCountChange}
              onSelectMedia={onSelectMedia}
            />
          ) : null}
          {item.type === 'poll' ? (
            <FeedPollCard poll={item} onVote={onVotePoll} />
          ) : null}
          {item.type === 'quiz' ? (
            <FeedQuizCard
              quiz={item}
              onAnswer={onAnswerQuiz}
              loading={Boolean(quizAnswerLoadingIds[item.id])}
            />
          ) : null}
          {item.type === 'article' ? (
            <FeedArticleCard article={item} onOpen={onOpenArticle} currentUser={currentUser} />
          ) : null}
        </Card>
      ))}
    </div>
  )
}
