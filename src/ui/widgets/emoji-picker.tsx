'use client'

import { useEffect, useRef, useState } from 'react'
import { Smile } from 'lucide-react'
import { EmojiPicker } from 'frimousse'

import { cn } from '@/lib/utils'
import { Button } from '@/ui/widgets/button'

interface EmojiPickerPopoverProps {
  onEmojiSelect: (emoji: string) => void
  disabled?: boolean
  align?: 'start' | 'end'
}

export const EmojiPickerPopover = ({
  onEmojiSelect,
  disabled,
  align = 'start',
}: EmojiPickerPopoverProps) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Эмодзи"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
      >
        <Smile className="h-4 w-4" />
      </Button>
      {open ? (
        <div
          className={cn(
            'absolute z-50 mt-2 w-[320px] rounded-xl border border-border bg-background p-2 shadow-lg',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          <EmojiPicker.Root
            columns={10}
            onEmojiSelect={({ emoji }) => {
              onEmojiSelect(emoji)
              setOpen(false)
            }}
            className="flex h-[320px] flex-col gap-2"
          >
            <EmojiPicker.Search
              placeholder="Поиск"
              className="h-9 rounded-md border border-border bg-muted/40 px-3 text-sm outline-none transition focus:border-primary"
            />
            <EmojiPicker.Viewport className="relative flex-1 overflow-y-auto">
              <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                Загрузка...
              </EmojiPicker.Loading>
              <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                Ничего не найдено
              </EmojiPicker.Empty>
              <EmojiPicker.List
                className="flex flex-col gap-2 pb-2"
                components={{
                  CategoryHeader: ({ category, ...props }) => (
                    <div
                      {...props}
                      className="sticky top-0 z-10 bg-background/95 pb-1 pt-2 text-xs font-medium text-muted-foreground"
                    >
                      {category.label}
                    </div>
                  ),
                  Row: ({ children, ...props }) => (
                    <div {...props} className="grid grid-cols-10 gap-1 px-1">
                      {children}
                    </div>
                  ),
                  Emoji: ({ emoji, ...props }) => (
                    <button
                      {...props}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition hover:bg-muted"
                    >
                      {emoji.emoji}
                    </button>
                  ),
                }}
              />
            </EmojiPicker.Viewport>
          </EmojiPicker.Root>
        </div>
      ) : null}
    </div>
  )
}
