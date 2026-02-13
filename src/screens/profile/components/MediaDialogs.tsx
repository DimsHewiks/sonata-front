'use client'

import type { MediaDialogsProps } from '@/screens/profile/profile-components.types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/widgets/dialog'
import { getMediaUrl } from '@/shared/config/api'
import { isVideoExtension } from '@/shared/lib/media'

export const MediaDialogs = ({
  selectedMedia,
  selectedPostMedia,
  onCloseMedia,
  onClosePostMedia,
}: MediaDialogsProps) => {
  const selectedMediaUrl = selectedMedia ? getMediaUrl(selectedMedia.relative_path) : null
  const selectedMediaIsVideo = selectedMedia
    ? isVideoExtension(selectedMedia.extension)
    : false

  return (
    <>
      <Dialog open={Boolean(selectedMedia)} onOpenChange={() => onCloseMedia()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Медиа</DialogTitle>
          </DialogHeader>
          {selectedMediaUrl ? (
            selectedMediaIsVideo ? (
              <video className="w-full rounded-xl" controls>
                <source src={selectedMediaUrl} />
              </video>
            ) : (
              <img src={selectedMediaUrl} alt="Медиа" className="w-full rounded-xl" />
            )
          ) : null}
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
          {selectedPostMedia ? (
            isVideoExtension(selectedPostMedia.extension) ? (
              <video className="w-full rounded-xl" controls>
                <source src={getMediaUrl(selectedPostMedia.relative_path)} />
              </video>
            ) : (
              <img
                src={getMediaUrl(selectedPostMedia.relative_path)}
                alt="Медиа"
                className="w-full rounded-xl"
              />
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
