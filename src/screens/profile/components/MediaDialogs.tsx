'use client'

import type { MediaDialogsProps } from '@/screens/profile/profile-components.types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/widgets/dialog'

export const MediaDialogs = ({
  selectedMedia,
  selectedPostMedia,
  onCloseMedia,
  onClosePostMedia,
}: MediaDialogsProps) => {
  return (
    <>
      <Dialog open={Boolean(selectedMedia)} onOpenChange={() => onCloseMedia()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Медиа</DialogTitle>
          </DialogHeader>
          {selectedMedia?.type === 'video' ? (
            <video className="w-full rounded-xl" controls>
              <source src={selectedMedia.url ?? selectedMedia.thumbUrl} />
            </video>
          ) : (
            <img
              src={selectedMedia?.thumbUrl}
              alt="Медиа"
              className="w-full rounded-xl"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedPostMedia)}
        onOpenChange={() => onClosePostMedia()}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Медиа поста</DialogTitle>
          </DialogHeader>
          {selectedPostMedia?.type === 'video' ? (
            <video className="w-full rounded-xl" controls>
              <source src={selectedPostMedia.url} />
            </video>
          ) : (
            <img
              src={selectedPostMedia?.url}
              alt="Медиа"
              className="w-full rounded-xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
