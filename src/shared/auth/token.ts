const ACCESS_TOKEN_KEY = 'sonata_access_token'

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export const setAccessToken = (token: string): void => {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export const clearAccessToken = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export const extractAccessToken = (
  authorizationHeader: string | undefined,
): string | null => {
  if (!authorizationHeader) {
    return null
  }

  const [scheme, token] = authorizationHeader.split(' ')
  if (!scheme || !token) {
    return null
  }

  if (scheme.toLowerCase() !== 'bearer') {
    return null
  }

  return token
}
