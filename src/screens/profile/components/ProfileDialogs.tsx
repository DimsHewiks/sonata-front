'use client'

import type { ChangeEvent } from 'react'
import { useRef } from 'react'
import { Upload } from 'lucide-react'

import type { ProfileDialogsProps } from '@/screens/profile/profile-components.types'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/widgets/avatar'
import { Button } from '@/ui/widgets/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/widgets/dialog'
import { Input } from '@/ui/widgets/input'
import { Label } from '@/ui/widgets/label'
import { Separator } from '@/ui/widgets/separator'
import { Switch } from '@/ui/widgets/switch'
import { Checkbox } from '@/ui/widgets/checkbox'
import { Textarea } from '@/ui/widgets/textarea'
import { EmojiPickerPopover } from '@/ui/widgets/emoji-picker'

export const ProfileDialogs = ({
  isEditOpen,
  isPrivacyOpen,
  editForm,
  editAvatarPreview,
  editAvatarFileName,
  editLoading,
  editError,
  instruments,
  selectedInstrumentIds,
  instrumentsLoading,
  instrumentsError,
  privacySettings,
  privacyLoading,
  privacyError,
  onEditOpenChange,
  onPrivacyOpenChange,
  onEditFieldChange,
  onEditAvatarChange,
  onToggleInstrument,
  onSaveEdit,
  onSavePrivacy,
  onPrivacyChange,
}: ProfileDialogsProps) => {
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null)

  const handleInsertDescriptionEmoji = (emoji: string) => {
    const textarea = descriptionRef.current
    const currentValue = textarea?.value ?? editForm.description
    const selectionStart = textarea?.selectionStart ?? currentValue.length
    const selectionEnd = textarea?.selectionEnd ?? currentValue.length
    const nextValue =
      currentValue.slice(0, selectionStart) + emoji + currentValue.slice(selectionEnd)

    onEditFieldChange('description', nextValue)

    if (textarea) {
      requestAnimationFrame(() => {
        const cursor = selectionStart + emoji.length
        textarea.focus()
        textarea.setSelectionRange(cursor, cursor)
      })
    }
  }

  return (
    <>
      <Dialog open={isEditOpen} onOpenChange={onEditOpenChange}>
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0">
          <div className="space-y-4 px-6 pt-6">
            <DialogHeader>
              <DialogTitle>Изменить мои данные</DialogTitle>
              <DialogDescription>Обновите основные данные профиля.</DialogDescription>
            </DialogHeader>
            {editError ? (
              <Alert variant="destructive">
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pr-5">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Имя</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(event) => onEditFieldChange('name', event.target.value)}
                disabled={editLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-login">Логин</Label>
              <Input
                id="edit-login"
                value={editForm.login}
                onChange={(event) => onEditFieldChange('login', event.target.value)}
                disabled={editLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(event) => onEditFieldChange('email', event.target.value)}
                disabled={editLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(event) =>
                  onEditFieldChange('description', event.target.value)
                }
                disabled={editLoading}
                rows={3}
                ref={descriptionRef}
              />
              <div className="flex items-center gap-2">
                <EmojiPickerPopover
                  onEmojiSelect={handleInsertDescriptionEmoji}
                  disabled={editLoading}
                />
                <div className="text-xs text-muted-foreground">
                  Чтобы очистить описание, оставьте поле пустым.
                </div>
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={editAvatarPreview ?? undefined} alt="Avatar" />
                  <AvatarFallback>{editForm.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">Аватар</div>
                  <div className="text-xs text-muted-foreground">
                    {editAvatarFileName ?? 'Файл не выбран'}
                  </div>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="edit-avatar-input"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onEditAvatarChange(event.target.files?.[0] ?? null)
                }
                disabled={editLoading}
              />
              <Label htmlFor="edit-avatar-input" className="block">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={editLoading}
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4" />
                    Загрузить аватар
                  </span>
                </Button>
              </Label>
            </div>
            <div className="space-y-3 pb-6">
              <div>
                <div className="text-sm font-medium">Инструменты</div>
                <div className="text-xs text-muted-foreground">
                  Выберите инструменты, которые хотите показать в профиле.
                </div>
              </div>
              {instrumentsError ? (
                <Alert variant="destructive">
                  <AlertTitle>Ошибка</AlertTitle>
                  <AlertDescription>{instrumentsError}</AlertDescription>
                </Alert>
              ) : null}
              {instrumentsLoading ? (
                <div className="text-xs text-muted-foreground">Загружаем список...</div>
              ) : instruments.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  Доступных инструментов пока нет.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {instruments.map((instrument) => {
                    const checked = selectedInstrumentIds.includes(instrument.id)
                    return (
                      <label
                        key={instrument.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            onToggleInstrument(instrument.id, value === true)
                          }
                          disabled={editLoading || instrumentsLoading}
                        />
                        <span>{instrument.name}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="w-full justify-end border-t border-border bg-background px-6 py-3">
            <Button variant="ghost" onClick={() => onEditOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={onSaveEdit} disabled={editLoading}>
              {editLoading ? 'Сохраняем...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPrivacyOpen} onOpenChange={onPrivacyOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Настройки приватности</DialogTitle>
            <DialogDescription>Выберите, какие данные доступны другим.</DialogDescription>
          </DialogHeader>
          {privacyError ? (
            <Alert variant="destructive">
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{privacyError}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Профиль виден всем</div>
                <div className="text-xs text-muted-foreground">Доступ к странице профиля</div>
              </div>
              <Switch
                checked={privacySettings.profilePublic}
                onCheckedChange={(checked) => onPrivacyChange('profilePublic', checked)}
                disabled={privacyLoading}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Показывать возраст</div>
                <div className="text-xs text-muted-foreground">Возраст в профиле</div>
              </div>
              <Switch
                checked={privacySettings.showAge}
                onCheckedChange={(checked) => onPrivacyChange('showAge', checked)}
                disabled={privacyLoading}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Показывать email</div>
                <div className="text-xs text-muted-foreground">Email в профиле</div>
              </div>
              <Switch
                checked={privacySettings.showEmail}
                onCheckedChange={(checked) => onPrivacyChange('showEmail', checked)}
                disabled={privacyLoading}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Медиа видны всем</div>
                <div className="text-xs text-muted-foreground">Фото и видео в профиле</div>
              </div>
              <Switch
                checked={privacySettings.mediaPublic}
                onCheckedChange={(checked) => onPrivacyChange('mediaPublic', checked)}
                disabled={privacyLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onPrivacyOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={onSavePrivacy} disabled={privacyLoading}>
              {privacyLoading ? 'Сохраняем...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
