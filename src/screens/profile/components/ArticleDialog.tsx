'use client'

import type { FeedArticle } from '@/shared/types/profile'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { Button } from '@/ui/widgets/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/widgets/dialog'

interface ArticleDialogProps {
  article: FeedArticle | null
  onClose: () => void
}

export const ArticleDialog = ({ article, onClose }: ArticleDialogProps) => {
  return (
    <Dialog open={Boolean(article)} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{article?.title ?? 'Статья'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {article?.description ? (
            <p className="text-sm text-muted-foreground">{article.description}</p>
          ) : null}
          <Alert>
            <AlertTitle>Редактор статьи будет позже</AlertTitle>
            <AlertDescription>
              Пока доступен только предпросмотр заготовки и базовые метаданные.
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
