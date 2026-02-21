'use client'

import { memo, useEffect, useRef } from 'react'

import type { ProfileFeedProps } from '@/screens/profile/profile-components.types'
import { Button } from '@/ui/widgets/button'
import { Card, CardContent } from '@/ui/widgets/card'
import { FeedArticleCard } from '@/shared/components/feed/FeedArticleCard'
import { FeedHeader } from '@/shared/components/feed/FeedHeader'
import { FeedPollCard } from '@/shared/components/feed/FeedPollCard'
import { FeedPostCard } from '@/shared/components/feed/FeedPostCard'
import { FeedQuizCard } from '@/shared/components/feed/FeedQuizCard'

interface ParallaxCardRef {
  card: HTMLElement
  img: HTMLImageElement
  factor: number
  scale: number
}

const PARALLAX_MAX_CARDS = 24
const PARALLAX_ROOT_MARGIN = '280px 0px'

const MemoizedFeedPollCard = memo(FeedPollCard)
MemoizedFeedPollCard.displayName = 'MemoizedFeedPollCard'

const ProfileFeedComponent = ({
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
  const parallaxCardsRef = useRef<ParallaxCardRef[]>([])
  const activeParallaxCardsRef = useRef<ParallaxCardRef[]>([])

  useEffect(() => {
    const container = feedRef.current
    if (!container) {
      return
    }

    const allParallaxCards = Array.from(
      container.querySelectorAll<HTMLElement>('[data-parallax-card]'),
    ).flatMap((card) => {
      const img = card.querySelector<HTMLImageElement>('[data-parallax-img]')
      if (!img) {
        return []
      }
      return [
        {
          card,
          img,
          factor: Number(card.dataset.parallaxFactor ?? '0.12'),
          scale: Number(card.dataset.parallaxScale ?? '1.2'),
        },
      ]
    })
    parallaxCardsRef.current = allParallaxCards

    if (!allParallaxCards.length) {
      return
    }

    if (allParallaxCards.length > PARALLAX_MAX_CARDS) {
      allParallaxCards.forEach(({ img, scale }) => {
        img.style.transform = `translate3d(0, 0px, 0) scale(${scale})`
      })

      return () => {
        parallaxCardsRef.current = []
        activeParallaxCardsRef.current = []
      }
    }

    let observer: IntersectionObserver | null = null
    let rafId: number | null = null
    const visibleCards = new Set<ParallaxCardRef>(allParallaxCards)
    activeParallaxCardsRef.current = allParallaxCards

    const updateParallax = () => {
      const viewportMid = window.innerHeight / 2

      activeParallaxCardsRef.current.forEach(({ card, img, factor, scale }) => {
        const rect = card.getBoundingClientRect()
        const elementMid = rect.top + rect.height / 2
        const offset = (viewportMid - elementMid) * factor
        const maxShift = (rect.height * (scale - 1)) / 2
        const clampedOffset = Math.max(-maxShift, Math.min(maxShift, offset))

        img.style.transform = `translate3d(0, ${clampedOffset}px, 0) scale(${scale})`
      })
    }

    const requestParallaxUpdate = () => {
      if (rafId !== null) {
        return
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        updateParallax()
      })
    }

    if (typeof IntersectionObserver !== 'undefined') {
      const cardByElement = new Map(allParallaxCards.map((item) => [item.card, item]))

      observer = new IntersectionObserver((entries) => {
        let changed = false

        entries.forEach((entry) => {
          const cardRef = cardByElement.get(entry.target as HTMLElement)
          if (!cardRef) {
            return
          }

          if (entry.isIntersecting) {
            if (!visibleCards.has(cardRef)) {
              visibleCards.add(cardRef)
              changed = true
            }
            return
          }

          if (visibleCards.delete(cardRef)) {
            changed = true
          }
        })

        if (!changed) {
          return
        }

        activeParallaxCardsRef.current = Array.from(visibleCards)
        requestParallaxUpdate()
      }, {
        root: null,
        rootMargin: PARALLAX_ROOT_MARGIN,
      })

      allParallaxCards.forEach(({ card }) => {
        observer?.observe(card)
      })
    }

    updateParallax()
    window.addEventListener('scroll', requestParallaxUpdate, { passive: true })
    window.addEventListener('resize', requestParallaxUpdate)

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }
      observer?.disconnect()
      parallaxCardsRef.current = []
      activeParallaxCardsRef.current = []
      window.removeEventListener('scroll', requestParallaxUpdate)
      window.removeEventListener('resize', requestParallaxUpdate)
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
            <MemoizedFeedPollCard poll={item} onVote={onVotePoll} />
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

export const ProfileFeed = memo(ProfileFeedComponent)
ProfileFeed.displayName = 'ProfileFeed'
