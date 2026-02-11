'use client'

import { Heart, MessageCircle, MoreHorizontal, Play, Share2 } from 'lucide-react'

import type { ProfileFeedProps } from '@/screens/profile/profile-components.types'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/widgets/avatar'
import { Badge } from '@/ui/widgets/badge'
import { Button } from '@/ui/widgets/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/ui/widgets/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/widgets/dropdown-menu'

export const ProfileFeed = ({
  posts,
  likedPosts,
  onToggleLike,
  onDeletePost,
  onSelectMedia,
  onCreateFirstPost,
}: ProfileFeedProps) => {
  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
          <p className="text-sm text-muted-foreground">Пока нет постов</p>
          <Button onClick={onCreateFirstPost}>Создать первый пост</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const likes = (post.stats?.likes ?? 0) + (likedPosts[post.id] ? 1 : 0)
        const media = post.media ?? []

        return (
          <Card key={post.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                  <AvatarFallback>{post.author.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-semibold">{post.author.name}</div>
                  <div className="text-xs text-muted-foreground">
                    @{post.author.login} · {post.createdAt}
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      navigator.clipboard.writeText(`https://sonata.ru/post/${post.id}`)
                    }
                  >
                    Скопировать ссылку
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDeletePost(post.id)}
                  >
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-4">
              {post.text ? <p className="text-sm">{post.text}</p> : null}
              {media.length ? (
                <div
                  className={
                    media.length === 1
                      ? 'overflow-hidden rounded-xl'
                      : 'grid gap-2 sm:grid-cols-2'
                  }
                >
                  {media.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="group relative aspect-video overflow-hidden rounded-xl border border-border"
                      onClick={() => onSelectMedia(item)}
                    >
                      {item.type === 'video' ? (
                        <video
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                          src={item.url}
                        />
                      ) : (
                        <img
                          src={item.thumbUrl ?? item.url}
                          alt="Media"
                          className="h-full w-full object-cover"
                        />
                      )}
                      {item.type === 'video' ? (
                        <>
                          <div className="absolute inset-0 bg-black/40" />
                          <Play className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-white" />
                          <Badge className="absolute right-2 top-2" variant="secondary">
                            Видео
                          </Badge>
                        </>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="flex items-center gap-4 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                className={likedPosts[post.id] ? 'text-primary' : undefined}
                onClick={() => onToggleLike(post.id)}
              >
                <Heart className="h-4 w-4" />
                {likes}
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-4 w-4" />
                {post.stats?.comments ?? 0}
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
                Поделиться
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
