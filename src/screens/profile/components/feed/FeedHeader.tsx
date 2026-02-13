'use client'

import { useState } from 'react'
import { Loader2, MoreHorizontal } from 'lucide-react'

import type { PostAuthor, FeedItem } from '@/shared/types/profile'
import { getApiErrorMessage } from '@/shared/api/errors'
import { getMediaUrl } from '@/shared/config/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/widgets/avatar'
import { Button } from '@/ui/widgets/button'
import { CardHeader } from '@/ui/widgets/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/widgets/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/widgets/dropdown-menu'
import { FeedTypeBadge } from '@/screens/profile/components/feed/FeedTypeBadge'

interface FeedHeaderProps {
  itemId: string
  type: FeedItem['type']
  author: PostAuthor
  createdAt: string
  onDelete: (itemId: string) => Promise<void>
}

export const FeedHeader = ({
  itemId,
  type,
  author,
  createdAt,
  onDelete,
}: FeedHeaderProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const avatarUrl = author.avatar?.relative_path
    ? getMediaUrl(author.avatar.relative_path)
    : undefined

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(`https://sonata.ru/feed/${itemId}`)
  }

  const handleDeleteConfirm = async () => {
    setDeleteError(null)
    setIsDeleting(true)

    try {
      await onDelete(itemId)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      setDeleteError(getApiErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={author.name} />
            <AvatarFallback>{author.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{author.name}</span>
              <FeedTypeBadge type={type} />
            </div>
            <div className="text-xs text-muted-foreground">
              @{author.login} · {createdAt}
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
            <DropdownMenuItem onClick={handleCopyLink}>Скопировать ссылку</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Удалить пост?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p className="text-sm text-destructive">{deleteError}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Удаляем...
                </>
              ) : (
                'Удалить'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
