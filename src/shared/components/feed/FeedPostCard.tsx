'use client'

import { memo, useCallback } from 'react'
import { Heart, Play, Share2 } from 'lucide-react'

import type { FeedPost, PostMedia } from '@/shared/types/profile'
import { Badge } from '@/ui/widgets/badge'
import { Button } from '@/ui/widgets/button'
import { CardContent, CardFooter } from '@/ui/widgets/card'
import { getMediaUrl } from '@/shared/config/api'
import { isVideoExtension } from '@/shared/lib/media'
import { FeedPostComments } from '@/shared/components/feed/FeedPostComments'

interface FeedPostCardProps {
  post: FeedPost
  liked: boolean
  onToggleLike: (postId: string) => void
  onCommentCountChange: (postId: string, delta: number) => void
  onSelectMedia: (media: PostMedia) => void
}

const FeedPostCardComponent = ({
  post,
  liked,
  onToggleLike,
  onCommentCountChange,
  onSelectMedia,
}: FeedPostCardProps) => {
  const handleToggleLike = useCallback(() => {
    onToggleLike(post.id)
  }, [onToggleLike, post.id])

  const handleCommentCountChange = useCallback(
    (delta: number) => {
      onCommentCountChange(post.id, delta)
    },
    [onCommentCountChange, post.id],
  )

  const likes = (post.stats?.likes ?? 0) + (liked ? 1 : 0)
  const comments = post.stats?.comments ?? 0
  const media = post.media ?? []
  const isMediaGrid = media.length > 1
  const gridClassName = isMediaGrid
    ? media.length <= 2
      ? 'grid grid-cols-2 gap-[3px]'
      : media.length <= 4
        ? 'grid grid-cols-3 gap-[3px]'
        : 'grid grid-cols-4 gap-[3px]'
    : 'w-full'

  return (
    <>
      <CardContent className="space-y-4">
        {post.text ? <p className="text-sm">{post.text}</p> : null}
        {media.length ? (
          <div className={gridClassName}>
            {media.map((item) => {
              const mediaUrl = getMediaUrl(item.relative_path)
              const isVideo = isVideoExtension(item.extension)

              return (
                <button
                  key={item.relative_path}
                  type="button"
                  className={
                    isMediaGrid
                      ? 'group relative aspect-square overflow-hidden'
                      : `group relative w-full overflow-hidden rounded-xl border border-border ${
                          isVideo ? 'aspect-video bg-black' : 'aspect-square bg-muted'
                        }`
                  }
                  onClick={() => onSelectMedia(item)}
                >
                  {isVideo ? (
                    <video
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      src={mediaUrl}
                    />
                  ) : isMediaGrid ? (
                    <img
                      src={mediaUrl}
                      alt="Media"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <img
                        src={mediaUrl}
                        alt="Media"
                        className="absolute inset-0 h-full w-full scale-110 object-cover blur-sm"
                      />
                      <img
                        src={mediaUrl}
                        alt="Media"
                        className="relative z-10 h-full w-full object-contain"
                      />
                    </>
                  )}
                  {isVideo ? (
                    <>
                      <div className="absolute inset-0 bg-black/40" />
                      <Play className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-white" />
                      <Badge className="absolute right-2 top-2" variant="secondary">
                        Видео
                      </Badge>
                    </>
                  ) : null}
                </button>
              )
            })}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          className={liked ? 'text-primary' : undefined}
          onClick={handleToggleLike}
        >
          <Heart className="h-4 w-4" />
          {likes}
        </Button>
        <FeedPostComments
          feedId={post.id}
          commentsCount={comments}
          onCommentCountChange={handleCommentCountChange}
        />
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4" />
          Поделиться
        </Button>
      </CardFooter>
    </>
  )
}

export const FeedPostCard = memo(FeedPostCardComponent)
FeedPostCard.displayName = 'FeedPostCard'
