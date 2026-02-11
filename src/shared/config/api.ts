export const getApiDomain = (): string => {
  const overrideDomain = process.env.NEXT_PUBLIC_API_DOMAIN
  if (overrideDomain) {
    return overrideDomain
  }

  const mode =
    process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development'

  if (mode === 'development') {
    return 'http://localhost:8080'
  }

  if (mode === 'dev') {
    return 'https://dev.sonata.ru'
  }

  if (mode === 'production') {
    return 'https://www.sonata.ru'
  }

  return 'http://localhost:8080'
}

export const getApiBaseUrl = (): string => {
  const overrideBaseUrl = process.env.NEXT_PUBLIC_API_URL
  if (overrideBaseUrl) {
    return overrideBaseUrl
  }

  return `${getApiDomain()}/api`
}

export const getMediaUrl = (path: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  if (path.startsWith('/')) {
    return `${getApiDomain()}${path}`
  }

  return `${getApiDomain()}/${path}`
}
