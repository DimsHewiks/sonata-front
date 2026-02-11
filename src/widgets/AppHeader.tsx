'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'

import { useAuthStore } from '@/features/auth/store'
import { useShallow } from 'zustand/shallow'
import { getMediaUrl } from '@/shared/config/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/widgets/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/widgets/dropdown-menu'

export const AppHeader = () => {
  const { init, logout, status, user } = useAuthStore(
    useShallow((state) => ({
      init: state.init,
      logout: state.logout,
      status: state.status,
      user: state.user,
    })),
  )
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'idle') {
      init()
    }
  }, [init, pathname, status])

  return (
    <header className="border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
            S
          </div>
          <div>
            <div className="text-lg font-semibold">Sonata</div>
            <div className="text-xs text-muted-foreground">
              Музыкальное комьюнити
            </div>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <span className="cursor-default">Лента</span>
          <span className="cursor-default">Сообщества</span>
          <span className="cursor-default">Треки</span>
        </nav>
        {status === 'authenticated' && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <Avatar>
                <AvatarImage
                  src={user.avatarPath ? getMediaUrl(user.avatarPath) : undefined}
                  alt={user.name}
                />
                <AvatarFallback>
                  {user.name ? user.name.slice(0, 2) : 'SN'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Профиль
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await logout()
                  router.push('/')
                }}
              >
                <LogOut className="mr-2 h-4 w-4 text-rose-500" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/auth"
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent"
          >
            Войти
          </Link>
        )}
      </div>
    </header>
  )
}
