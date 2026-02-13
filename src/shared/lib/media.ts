const VIDEO_EXTENSIONS = new Set([
  'mp4',
  'webm',
  'mov',
  'm4v',
  'avi',
  'mkv',
])

export const normalizeExtension = (extension: string): string => {
  return extension.trim().toLowerCase().replace(/^\./, '')
}

export const isVideoExtension = (extension: string): boolean => {
  return VIDEO_EXTENSIONS.has(normalizeExtension(extension))
}
