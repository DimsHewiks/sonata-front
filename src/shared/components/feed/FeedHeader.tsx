'use client'

import { memo, useCallback, useState } from 'react'
import { Link2, Loader2, MoreHorizontal, Trash2 } from 'lucide-react'

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
import { FeedTypeBadge } from '@/shared/components/feed/FeedTypeBadge'

interface FeedHeaderProps {
  itemId: string
  type: FeedItem['type']
  author: PostAuthor
  createdAt: string
  onDelete: (itemId: string) => Promise<void>
  canDelete?: boolean
}

const FeedHeaderComponent = ({
  itemId,
  type,
  author,
  createdAt,
  onDelete,
  canDelete = true,
}: FeedHeaderProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const avatarUrl = author.avatar?.relative_path
    ? getMediaUrl(author.avatar.relative_path)
    : undefined

  const handleCopyLink = useCallback(() => {
    void navigator.clipboard.writeText(`https://sonata.ru/feed/${itemId}`)
  }, [itemId])

  const handleDeleteConfirm = useCallback(async () => {
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
  }, [itemId, onDelete])

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
            <DropdownMenuItem onClick={handleCopyLink} className="text-sky-700 focus:text-sky-700">
              <Link2 className="h-4 w-4" />
              Скопировать ссылку
            </DropdownMenuItem>
            {canDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      {canDelete ? (
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
      ) : null}
    </>
  )
}

export const FeedHeader = memo(FeedHeaderComponent)
FeedHeader.displayName = 'FeedHeader'
