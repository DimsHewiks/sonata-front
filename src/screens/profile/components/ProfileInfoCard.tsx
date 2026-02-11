'use client'

import { Copy } from 'lucide-react'

import type { ProfileInfoCardProps } from '@/screens/profile/profile-components.types'
import { Button } from '@/ui/widgets/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/widgets/card'
import { Separator } from '@/ui/widgets/separator'

export const ProfileInfoCard = ({
  uuid,
  email,
  age,
  onCopyUuid,
}: ProfileInfoCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Информация</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">UUID</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {uuid.slice(0, 8)}…{uuid.slice(-6)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCopyUuid}
              aria-label="Скопировать UUID"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Email</span>
          <span>{email ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Возраст</span>
          <span>{age}</span>
        </div>
      </CardContent>
    </Card>
  )
}
