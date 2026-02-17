'use client'

import { useMemo, useState } from 'react'
import { Settings, UserPlus, Users } from 'lucide-react'

import type { ProfileHeaderProps } from '@/screens/profile/profile-components.types'
import type { InstrumentSticker } from '@/shared/types/profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/widgets/avatar'
import { Button } from '@/ui/widgets/button'
import { Card, CardContent } from '@/ui/widgets/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/widgets/dropdown-menu'

export const ProfileHeaderCard = ({
  displayName,
  displayLogin,
  avatarUrl,
  description,
  instruments,
  followersCount = 0,
  followingCount = 0,
  onOpenEdit,
  onOpenPrivacy,
}: ProfileHeaderProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const descriptionLimit = 140
  const normalizedDescription = description?.trim() ?? ''
  const isTrimmable = normalizedDescription.length > descriptionLimit
  const descriptionText = useMemo(() => {
    if (!isTrimmable || isDescriptionExpanded) {
      return normalizedDescription
    }
    return `${normalizedDescription.slice(0, descriptionLimit).trimEnd()}...`
  }, [descriptionLimit, isDescriptionExpanded, isTrimmable, normalizedDescription])

  const stickerEmojiMap: Record<InstrumentSticker, string> = {
    guitar: '🎸',
    'electric-guitar': '🎸',
    piano: '🎹',
    drums: '🥁',
    bass: '🎸',
    microphone: '🎤',
    accordion: '🪗',
    bayan: '🪗',
  }

  const instrumentIcons =
    instruments?.flatMap((instrument) => {
      if (!instrument.sticker) {
        return []
      }
      const icon = stickerEmojiMap[instrument.sticker] ?? '🎵'
      return [{ id: instrument.id, name: instrument.name, icon }]
    }) ?? []

  const formatCompactCount = (value: number): string => {
    if (value < 1000) {
      return `${value}`
    }
    if (value < 10000) {
      return `${(value / 1000).toFixed(1).replace('.0', '')}к`
    }
    return `${Math.round(value / 1000)}к`
  }

  return (
    <Card>
      <CardContent className="relative flex flex-wrap items-start justify-between gap-4 p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border border-border">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{displayName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{displayName}</h1>
              {instrumentIcons.length > 0 && (
                <div
                  className="flex flex-wrap items-center gap-1 text-xl"
                  aria-label="Инструменты"
                >
                  {instrumentIcons.map((instrument) => (
                    <span
                      key={instrument.id}
                      className="leading-none"
                      title={instrument.name}
                      aria-label={instrument.name}
                    >
                      {instrument.icon}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">@{displayLogin}</p>
            <div className="mt-2 text-sm text-muted-foreground">
              <span className="whitespace-pre-line">{descriptionText}</span>
              {isTrimmable ? (
                <>
                  {' '}
                  <button
                    type="button"
                    className="text-blue-500 underline decoration-dashed underline-offset-4"
                    onClick={() =>
                      setIsDescriptionExpanded((prev) => !prev)
                    }
                  >
                    {isDescriptionExpanded ? 'свернуть' : 'читать полностью'}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpenEdit}>Изменить мои данные</DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenPrivacy}>
              Настройки приватности
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="absolute bottom-4 right-10 flex items-center gap-5 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4.5 w-4.5" />
            <span>{formatCompactCount(followersCount)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserPlus className="h-4.5 w-4.5" />
            <span>{formatCompactCount(followingCount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
