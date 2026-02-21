'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useShallow } from 'zustand/shallow'
import { ChevronDown, Loader2 } from 'lucide-react'

import { useAuthStore } from '@/features/auth/store'
import { feedApi } from '@/features/feed/api'
import type { QuizAnswerResult } from '@/features/feed/types'
import type { FeedArticle, FeedItem, PostMedia } from '@/shared/types/profile'
import { getApiErrorMessage } from '@/shared/api/errors'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { Button } from '@/ui/widgets/button'
import { Card, CardContent } from '@/ui/widgets/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/widgets/dropdown-menu'
import { ArticleDialog } from '@/screens/profile/components/ArticleDialog'
import { MediaDialogs } from '@/screens/profile/components/MediaDialogs'
import { FeedArticleCard } from '@/shared/components/feed/FeedArticleCard'
import { FeedHeader } from '@/shared/components/feed/FeedHeader'
import { FeedPollCard } from '@/shared/components/feed/FeedPollCard'
import { FeedPostCard } from '@/shared/components/feed/FeedPostCard'
import { FeedQuizCard } from '@/shared/components/feed/FeedQuizCard'

const PAGE_LIMIT = 20

type HomeFeedFilter = 'all' | 'post' | 'poll' | 'quiz' | 'article' | 'breakdown'
type HomeFeedSort = 'newest' | 'popular' | 'following'

const HOME_FEED_FILTERS: Array<{ key: HomeFeedFilter; label: string }> = [
  { key: 'all', label: 'Все' },
  { key: 'post', label: 'Посты' },
  { key: 'poll', label: 'Опросы' },
  { key: 'quiz', label: 'Викторины' },
  { key: 'article', label: 'Статьи' },
  { key: 'breakdown', label: 'Разборы 🎸' },
]

const HOME_FEED_SORT_LABELS: Record<HomeFeedSort, string> = {
  newest: 'Сначала новые',
  popular: 'Популярные',
  following: 'По подпискам',
}

const noop = () => undefined

const mergeFeedItemsById = (currentItems: FeedItem[], nextItems: FeedItem[]): FeedItem[] => {
  const byId = new Map<string, FeedItem>()
  currentItems.forEach((item) => {
    byId.set(item.id, item)
  })
  nextItems.forEach((item) => {
    byId.set(item.id, item)
  })

  return Array.from(byId.values())
}

const getPopularityScore = (item: FeedItem): number => {
  if (item.type === 'post') {
    return (item.stats?.likes ?? 0) + (item.stats?.comments ?? 0)
  }
  if (item.type === 'poll') {
    return item.totalVotes ?? item.options.reduce((sum, option) => sum + option.votes, 0)
  }
  if (item.type === 'quiz') {
    return item.options.length
  }

  return 0
}

export const HomePage = () => {
  const { init, status, user } = useAuthStore(
    useShallow((state) => ({
      init: state.init,
      status: state.status,
      user: state.user,
    })),
  )
  const router = useRouter()

  const [items, setItems] = useState<FeedItem[]>([])
  const [feedError, setFeedError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextOffset, setNextOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [hasInitialLoad, setHasInitialLoad] = useState(false)

  const [activeFilter, setActiveFilter] = useState<HomeFeedFilter>('all')
  const [activeSort, setActiveSort] = useState<HomeFeedSort>('newest')

  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({})
  const [selectedPostMedia, setSelectedPostMedia] = useState<PostMedia | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<FeedArticle | null>(null)
  const [quizAnswerLoadingIds, setQuizAnswerLoadingIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (status === 'idle') {
      init()
    }
  }, [init, status])

  const fetchFeedPage = useCallback(async (offset: number, append: boolean) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setInitialLoading(true)
    }

    setFeedError(null)

    try {
      const pageItems = await feedApi.listAll({
        offset,
        limit: PAGE_LIMIT,
      })

      setItems((prev) => (append ? mergeFeedItemsById(prev, pageItems) : pageItems))
      setNextOffset(offset + pageItems.length)
      setHasMore(pageItems.length === PAGE_LIMIT)
    } catch (error) {
      setFeedError(getApiErrorMessage(error))
    } finally {
      if (append) {
        setLoadingMore(false)
      } else {
        setInitialLoading(false)
        setHasInitialLoad(true)
      }
    }
  }, [])

  useEffect(() => {
    if (hasInitialLoad || initialLoading) {
      return
    }

    void fetchFeedPage(0, false)
  }, [fetchFeedPage, hasInitialLoad, initialLoading])

  const handleLoadMore = useCallback(() => {
    if (loadingMore || initialLoading || !hasMore) {
      return
    }

    void fetchFeedPage(nextOffset, true)
  }, [fetchFeedPage, hasMore, initialLoading, loadingMore, nextOffset])

  const handleDeleteItem = useCallback(async (itemId: string) => {
    try {
      const response = await feedApi.deleteItem(itemId)
      if (!response.deleted) {
        throw new Error('Не удалось удалить публикацию')
      }

      setItems((prev) => prev.filter((item) => item.id !== response.feedId))
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

    setItems((prev) => {
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
    setItems((prev) => {
      const itemIndex = prev.findIndex((item) => item.type === 'poll' && item.id === pollId)
      if (itemIndex < 0) {
        return prev
      }

      const item = prev[itemIndex]
      if (item.type !== 'poll' || item.userVoteIds.length) {
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
    setItems((prev) => {
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
    if (status !== 'authenticated') {
      router.push('/auth')
      return
    }

    if (quizAnswerLoadingIds[quizId]) {
      return
    }

    const currentQuiz = items.find(
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
  }, [applyQuizResult, items, quizAnswerLoadingIds, router, status])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeFilter === 'all') {
        return true
      }
      if (activeFilter === 'breakdown') {
        return item.type === 'article' && item.articleType === 'song'
      }
      if (activeFilter === 'article') {
        return item.type === 'article' && item.articleType !== 'song'
      }
      return item.type === activeFilter
    })
  }, [activeFilter, items])

  const visibleItems = useMemo(() => {
    if (activeSort !== 'popular') {
      return filteredItems
    }

    return [...filteredItems].sort((a, b) => getPopularityScore(b) - getPopularityScore(a))
  }, [activeSort, filteredItems])

  const isAuthLoading = status === 'idle' || status === 'loading'

  return (
    <div className="mx-auto grid w-full max-w-[1080px] gap-8 lg:grid-cols-[minmax(0,720px)_280px] lg:items-start lg:justify-center">
      <section className="w-full max-w-[720px] justify-self-center">
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {HOME_FEED_FILTERS.map((filter) => (
                <Button
                  key={filter.key}
                  type="button"
                  size="sm"
                  variant="outline"
                  className={
                    activeFilter === filter.key
                      ? 'h-9 rounded-md border-primary/30 bg-primary/10 px-3 text-primary'
                      : 'h-9 rounded-md border-border/80 bg-transparent px-3 text-muted-foreground'
                  }
                  onClick={() => setActiveFilter(filter.key)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            <div className="justify-self-start md:justify-self-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="h-9 rounded-md">
                    {HOME_FEED_SORT_LABELS[activeSort]}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setActiveSort('newest')}>
                    Сначала новые
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveSort('popular')}>
                    Популярные
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveSort('following')}>
                    По подпискам
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {feedError ? (
            <Alert variant="destructive">
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{feedError}</AlertDescription>
            </Alert>
          ) : null}

          {isAuthLoading || (initialLoading && !hasInitialLoad) ? (
            <Card>
              <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Загружаем ленту...
              </CardContent>
            </Card>
          ) : null}

          {!isAuthLoading && !initialLoading && visibleItems.length === 0 ? (
            <Card>
              <CardContent className="space-y-3 p-6 text-center text-sm text-muted-foreground">
                <p>В этой выборке пока нет публикаций.</p>
                {feedError ? (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void fetchFeedPage(0, false)}
                    >
                      Повторить
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {visibleItems.map((item) => (
            <Card
              key={item.id}
              className="transition-shadow duration-200 hover:shadow-[0_8px_22px_rgba(15,23,42,0.08)]"
            >
              <FeedHeader
                itemId={item.id}
                type={item.type}
                author={item.author}
                createdAt={item.createdAt}
                onDelete={handleDeleteItem}
                canDelete={Boolean(user && item.author.login === user.login)}
              />
              {item.type === 'post' ? (
                <FeedPostCard
                  post={item}
                  liked={Boolean(likedPosts[item.id])}
                  onToggleLike={handleToggleLike}
                  onCommentCountChange={handleCommentCountChange}
                  onSelectMedia={setSelectedPostMedia}
                />
              ) : null}
              {item.type === 'poll' ? (
                <FeedPollCard poll={item} onVote={handleVotePoll} />
              ) : null}
              {item.type === 'quiz' ? (
                <FeedQuizCard
                  quiz={item}
                  onAnswer={handleAnswerQuiz}
                  loading={Boolean(quizAnswerLoadingIds[item.id])}
                />
              ) : null}
              {item.type === 'article' ? (
                <FeedArticleCard
                  article={item}
                  onOpen={setSelectedArticle}
                  currentUser={user ? { login: user.login } : null}
                />
              ) : null}
            </Card>
          ))}

          {visibleItems.length > 0 && hasMore ? (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore || initialLoading}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Загружаем...
                  </>
                ) : (
                  'Показать ещё'
                )}
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      <aside className="w-full lg:w-[280px] lg:justify-self-start">
        <div className="space-y-4 lg:sticky lg:top-24">
          <Card>
            <CardContent className="space-y-3 p-4">
              <h2 className="text-sm font-semibold">Быстро создать</h2>
              <div className="grid gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => router.push('/profile')}>
                  Пост
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => router.push('/profile')}>
                  Опрос
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => router.push('/profile')}>
                  Статью
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
              <div className="text-sm font-semibold text-foreground">Сейчас в ленте</div>
              <div className="flex items-center justify-between">
                <span>Публикаций загружено</span>
                <span className="font-medium text-foreground">{items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Текущий фильтр</span>
                <span className="font-medium text-foreground">
                  {HOME_FEED_FILTERS.find((item) => item.key === activeFilter)?.label ?? 'Все'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </aside>

      <MediaDialogs
        selectedMedia={null}
        selectedPostMedia={selectedPostMedia}
        onCloseMedia={noop}
        onClosePostMedia={() => setSelectedPostMedia(null)}
      />
      <ArticleDialog article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </div>
  )
}
