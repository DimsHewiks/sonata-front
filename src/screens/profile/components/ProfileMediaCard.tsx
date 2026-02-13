'use client'

import type { ProfileMediaCardProps } from '@/screens/profile/profile-components.types'
import type { MediaItem, MediaType } from '@/shared/types/profile'
import { getMediaUrl } from '@/shared/config/api'
import { isVideoExtension } from '@/shared/lib/media'
import { Badge } from '@/ui/widgets/badge'
import { Button } from '@/ui/widgets/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/widgets/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/widgets/tabs'
import { Play } from 'lucide-react'

export const ProfileMediaCard = ({
  mediaItems,
  activeTab,
  onTabChange,
  onSelectMedia,
  onCreatePost,
}: ProfileMediaCardProps) => {
  const getItemType = (item: MediaItem): MediaType =>
    isVideoExtension(item.extension) ? 'video' : 'image'

  const renderMediaGrid = (items: MediaItem[]) => {
    if (!items.length) {
      return (
        <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">Пока нет медиа</p>
          <Button variant="outline" size="sm" onClick={onCreatePost}>
            Создать пост
          </Button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item) => {
          const mediaUrl = getMediaUrl(item.relative_path)
          const mediaType = getItemType(item)

          return (
            <button
              key={item.relative_path}
              type="button"
              className="group relative aspect-square overflow-hidden rounded-lg border border-border"
              onClick={() => onSelectMedia(item)}
            >
              {mediaType === 'video' ? (
                <video
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  muted
                  playsInline
                  preload="metadata"
                >
                  <source src={mediaUrl} />
                </video>
              ) : (
                <img
                  src={mediaUrl}
                  alt="Медиа"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              )}
              {mediaType === 'video' ? (
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
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Медиа</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as typeof activeTab)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="w-full data-[state=active]:shadow-none">
              Все
            </TabsTrigger>
            <TabsTrigger value="image" className="w-full data-[state=active]:shadow-none">
              Фото
            </TabsTrigger>
            <TabsTrigger value="video" className="w-full data-[state=active]:shadow-none">
              Видео
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            {renderMediaGrid(mediaItems)}
          </TabsContent>
          <TabsContent value="image" className="mt-4">
            {renderMediaGrid(mediaItems.filter((item) => getItemType(item) === 'image'))}
          </TabsContent>
          <TabsContent value="video" className="mt-4">
            {renderMediaGrid(mediaItems.filter((item) => getItemType(item) === 'video'))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
