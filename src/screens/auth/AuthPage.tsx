'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, Loader2, Upload } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { authApi } from '@/features/auth/api'
import { useAuthStore } from '@/features/auth/store'
import { useShallow } from 'zustand/shallow'
import { getApiErrorMessage } from '@/shared/api/errors'
import { Alert, AlertDescription, AlertTitle } from '@/ui/widgets/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/widgets/avatar'
import { Button } from '@/ui/widgets/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/ui/widgets/card'
import { Checkbox } from '@/ui/widgets/checkbox'
import { Input } from '@/ui/widgets/input'
import { Label } from '@/ui/widgets/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/widgets/tabs'

type AuthTab = 'login' | 'register'

export const AuthPage = () => {
  const router = useRouter()
  const { init, status } = useAuthStore(
    useShallow((state) => ({
      init: state.init,
      status: state.status,
    })),
  )

  const [activeTab, setActiveTab] = useState<AuthTab>('login')
  const [loginForm, setLoginForm] = useState({
    login: '',
    password: '',
    remember: false,
  })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    age: '',
    login: '',
    email: '',
    password: '',
  })
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false)
  const [isSubmittingRegister, setIsSubmittingRegister] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (status === 'idle') {
      init()
      return
    }

    if (status === 'authenticated') {
      router.replace('/')
    }
  }, [init, router, status])

  const avatarPreview = useMemo(() => {
    if (!avatarFile) {
      return null
    }

    return URL.createObjectURL(avatarFile)
  }, [avatarFile])

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError(null)
    setIsSubmittingLogin(true)

    try {
      const response = await authApi.login({
        login: loginForm.login,
        password: loginForm.password,
      })
      if (!response.accessToken) {
        setLoginError('Не удалось получить токен авторизации.')
        return
      }

      await init()
      router.push('/')
    } catch (error) {
      setLoginError(getApiErrorMessage(error))
    } finally {
      setIsSubmittingLogin(false)
    }
  }

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRegisterError(null)
    setIsSubmittingRegister(true)

    try {
      await authApi.register({
        name: registerForm.name,
        age: registerForm.age,
        login: registerForm.login,
        email: registerForm.email,
        password: registerForm.password,
        avatar: avatarFile,
      })

      setActiveTab('login')
      setLoginForm((prev) => ({ ...prev, login: registerForm.login }))
      setRegisterForm({
        name: '',
        age: '',
        login: '',
        email: '',
        password: '',
      })
      setAvatarFile(null)
    } catch (error) {
      setRegisterError(getApiErrorMessage(error))
    } finally {
      setIsSubmittingRegister(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col">
      <Card className="border-border/70 shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
              S
            </div>
            <div className="text-lg font-semibold">Sonata</div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl">
              {activeTab === 'login' ? 'Вход в Sonata' : 'Создать аккаунт'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'login'
                ? 'Рады видеть тебя снова'
                : 'Пара шагов — и ты внутри'}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as AuthTab)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                {loginError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Ошибка</AlertTitle>
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="login-identity">Логин или email</Label>
                  <Input
                    id="login-identity"
                    type="text"
                    autoComplete="username"
                    placeholder="dims или name@example.com"
                    value={loginForm.login}
                    onChange={(event) =>
                      setLoginForm((prev) => ({
                        ...prev,
                        login: event.target.value,
                      }))
                    }
                    required
                    disabled={isSubmittingLogin}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Пароль</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Введите пароль"
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      required
                      disabled={isSubmittingLogin}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      aria-label={
                        showLoginPassword ? 'Скрыть пароль' : 'Показать пароль'
                      }
                      disabled={isSubmittingLogin}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={loginForm.remember}
                      onCheckedChange={(checked) =>
                        setLoginForm((prev) => ({
                          ...prev,
                          remember: Boolean(checked),
                        }))
                      }
                      disabled={isSubmittingLogin}
                    />
                    <span>Запомнить меня</span>
                  </label>
                  <Link
                    href="#"
                    className="text-primary transition hover:underline"
                  >
                    Забыли пароль?
                  </Link>
                </div>
                <Button className="w-full" type="submit" disabled={isSubmittingLogin}>
                  {isSubmittingLogin ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Входим...
                    </>
                  ) : (
                    'Войти'
                  )}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register" className="mt-6">
              <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                {registerError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Ошибка</AlertTitle>
                    <AlertDescription>{registerError}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="register-name">Имя</Label>
                  <Input
                    id="register-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Алекс"
                    value={registerForm.name}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    required
                    disabled={isSubmittingRegister}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-age">Возраст</Label>
                  <Input
                    id="register-age"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="18"
                    value={registerForm.age}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        age: event.target.value,
                      }))
                    }
                    required
                    disabled={isSubmittingRegister}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-login">Логин</Label>
                  <Input
                    id="register-login"
                    type="text"
                    autoComplete="username"
                    placeholder="dims"
                    value={registerForm.login}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        login: event.target.value,
                      }))
                    }
                    required
                    disabled={isSubmittingRegister}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email (необязательно)</Label>
                  <Input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    disabled={isSubmittingRegister}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Пароль</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Придумайте пароль"
                      value={registerForm.password}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      required
                      disabled={isSubmittingRegister}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => setShowRegisterPassword((prev) => !prev)}
                      aria-label={
                        showRegisterPassword
                          ? 'Скрыть пароль'
                          : 'Показать пароль'
                      }
                      disabled={isSubmittingRegister}
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage src={avatarPreview ?? undefined} alt="Avatar" />
                      <AvatarFallback>
                        {registerForm.name ? registerForm.name.slice(0, 1) : 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-medium">
                        Аватар (необязательно)
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {avatarFile ? avatarFile.name : 'Файл не выбран'}
                      </div>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      setAvatarFile(event.target.files?.[0] ?? null)
                    }
                    disabled={isSubmittingRegister}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmittingRegister}
                  >
                    <Upload className="h-4 w-4" />
                    Загрузить аватар (необязательно)
                  </Button>
                </div>
                <Button
                  className="w-full"
                  type="submit"
                  disabled={isSubmittingRegister}
                >
                  {isSubmittingRegister ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Создаем аккаунт...
                    </>
                  ) : (
                    'Зарегистрироваться'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
          {activeTab === 'login' ? (
            <>
              <span>Нет аккаунта?</span>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0"
                onClick={() => setActiveTab('register')}
              >
                Зарегистрироваться
              </Button>
            </>
          ) : (
            <>
              <span>Уже есть аккаунт?</span>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0"
                onClick={() => setActiveTab('login')}
              >
                Войти
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
