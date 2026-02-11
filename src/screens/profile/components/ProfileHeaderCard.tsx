'use client'

import { Settings } from 'lucide-react'

import type { ProfileHeaderProps } from '@/screens/profile/profile-components.types'
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
  onOpenEdit,
  onOpenPrivacy,
}: ProfileHeaderProps) => {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-start justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-border">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{displayName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">@{displayLogin}</p>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
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
      </CardContent>
    </Card>
  )
}
