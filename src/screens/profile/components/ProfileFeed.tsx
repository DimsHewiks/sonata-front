'use client'

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
    <div className="space-y-4">
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
            <FeedArticleCard article={item} onOpen={onOpenArticle} />
          ) : null}
        </Card>
      ))}
    </div>
  )
}
