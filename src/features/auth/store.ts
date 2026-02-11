'use client'

import { create } from 'zustand'

import { authApi } from '@/features/auth/api'
import type { AuthStatus, ProfileResponse } from '@/features/auth/types'
import { getApiErrorMessage, isUnauthorizedError } from '@/shared/api/errors'
import { clearAccessToken, getAccessToken } from '@/shared/auth/token'

type AuthStoreState = {
  status: AuthStatus
  user: ProfileResponse | null
  error: string | null
  init: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  status: 'idle',
  user: null,
  error: null,
  init: async () => {
    if (!getAccessToken()) {
      set({ status: 'guest', user: null, error: null })
      return
    }

    if (get().status === 'loading') {
      return
    }

    set({ status: 'loading', error: null })

    try {
      const profile = await authApi.me()
      set({ status: 'authenticated', user: profile })
    } catch (error) {
      if (isUnauthorizedError(error)) {
        try {
          const refreshed = await authApi.refresh()
          if (refreshed.accessToken) {
            const profile = await authApi.me()
            set({ status: 'authenticated', user: profile })
            return
          }
        } catch (refreshError) {
          set({ error: getApiErrorMessage(refreshError) })
        }
      }

      clearAccessToken()
      if (isUnauthorizedError(error)) {
        set({ status: 'guest', user: null, error: null })
      } else {
        set({
          status: 'error',
          user: null,
          error: getApiErrorMessage(error),
        })
      }
    }
  },
  logout: async () => {
    await authApi.logout()
    set({ status: 'guest', user: null, error: null })
  },
}))
