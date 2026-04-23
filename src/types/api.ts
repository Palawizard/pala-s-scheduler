export type ApiSuccess<T> = {
  data: T
  error?: never
}

export type ApiError = {
  data?: never
  error: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
}
