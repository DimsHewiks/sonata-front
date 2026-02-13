'use client'

import { Heart, Play, Share2 } from 'lucide-react'

import type { FeedPost, PostMedia } from '@/shared/types/profile'
import { Badge } from '@/ui/widgets/badge'
import { Button } from '@/ui/widgets/button'
import { CardContent, CardFooter } from '@/ui/widgets/card'
import { getMediaUrl } from '@/shared/config/api'
import { isVideoExtension } from '@/shared/lib/media'
import { FeedPostComments } from '@/screens/profile/components/feed/FeedPostComments'

interface FeedPostCardProps {
  post: FeedPost
  liked: boolean
  onToggleLike: (postId: string) => void
  onCommentCountChange: (postId: string, delta: number) => void
  onSelectMedia: (media: PostMedia) => void
}

export const FeedPostCard = ({
  post,
  liked,
  onToggleLike,
  onCommentCountChange,
  onSelectMedia,
}: FeedPostCardProps) => {
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
    : 'overflow-hidden rounded-xl'

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
                      : 'group relative aspect-video overflow-hidden rounded-xl border border-border'
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
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="Media"
                      className="h-full w-full object-cover"
                    />
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
          onClick={() => onToggleLike(post.id)}
        >
          <Heart className="h-4 w-4" />
          {likes}
        </Button>
        <FeedPostComments
          feedId={post.id}
          commentsCount={comments}
          onCommentCountChange={(delta) => onCommentCountChange(post.id, delta)}
        />
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4" />
          Поделиться
        </Button>
      </CardFooter>
    </>
  )
}
