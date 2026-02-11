'use client'

import { Play } from 'lucide-react'

import type { ProfileMediaCardProps } from '@/screens/profile/profile-components.types'
import type { MediaItem } from '@/shared/types/profile'
import { Badge } from '@/ui/widgets/badge'
import { Button } from '@/ui/widgets/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/widgets/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/widgets/tabs'

export const ProfileMediaCard = ({
  mediaItems,
  activeTab,
  onTabChange,
  onSelectMedia,
  onCreatePost,
}: ProfileMediaCardProps) => {
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
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="group relative aspect-square overflow-hidden rounded-lg border border-border"
            onClick={() => onSelectMedia(item)}
          >
            <img
              src={item.thumbUrl}
              alt="Медиа"
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
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
            <TabsTrigger value="all" className="w-full">
              Все
            </TabsTrigger>
            <TabsTrigger value="image" className="w-full">
              Фото
            </TabsTrigger>
            <TabsTrigger value="video" className="w-full">
              Видео
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            {renderMediaGrid(mediaItems)}
          </TabsContent>
          <TabsContent value="image" className="mt-4">
            {renderMediaGrid(mediaItems.filter((item) => item.type === 'image'))}
          </TabsContent>
          <TabsContent value="video" className="mt-4">
            {renderMediaGrid(mediaItems.filter((item) => item.type === 'video'))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
