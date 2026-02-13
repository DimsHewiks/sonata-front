'use client'

import type { ChangeEvent } from 'react'
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

export const ProfileDialogs = ({
  isEditOpen,
  isPrivacyOpen,
  editForm,
  editAvatarPreview,
  editAvatarFileName,
  editLoading,
  editError,
  privacySettings,
  privacyLoading,
  privacyError,
  onEditOpenChange,
  onPrivacyOpenChange,
  onEditFieldChange,
  onEditAvatarChange,
  onSaveEdit,
  onSavePrivacy,
  onPrivacyChange,
}: ProfileDialogsProps) => {
  return (
    <>
      <Dialog open={isEditOpen} onOpenChange={onEditOpenChange}>
        <DialogContent>
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
          <div className="space-y-4">
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
          </div>
          <DialogFooter>
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
