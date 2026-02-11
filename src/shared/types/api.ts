export interface ApiErrorMessageObject {
  code?: string
  message?: string
  details?: string | string[] | Record<string, string>
}

export interface ApiErrorPayload {
  message?: string | ApiErrorMessageObject
  error?: string | ApiErrorMessageObject
  code?: string
  details?: string | string[] | Record<string, string>
}
