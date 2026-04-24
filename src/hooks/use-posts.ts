'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Platform, PostContentType, PostStatus, PostVisibility } from '@/types'

export type PostPlatformView = {
  id: string
  platform: Platform
  contentType: PostContentType | null
  visibility: PostVisibility | null
  status: 'PENDING' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED'
  platformPostId: string | null
  errorMessage: string | null
  publishedAt: string | null
  platformUsername: string | null
  platformAvatar: string | null
}

export type PostView = {
  id: string
  title: string | null
  caption: string | null
  hashtags: string[]
  mediaUrls: string[]
  thumbnailUrl: string | null
  scheduledAt: string | null
  publishedAt: string | null
  status: PostStatus
  createdAt: string
  updatedAt: string
  platforms: PostPlatformView[]
}

export type PostsFilters = {
  status?: PostStatus
  platform?: Platform
  from?: string
  to?: string
}

export type PostPayload = {
  title?: string | null
  caption?: string | null
  hashtags?: string[]
  mediaUrls?: string[]
  thumbnailUrl?: string | null
  scheduledAt?: string | null
  platforms?: PostPlatformInput[]
  status?: PostStatus
}

export type PostPlatformInput = {
  platform: Platform
  contentType?: PostContentType | null
  visibility?: PostVisibility | null
}

function buildPostsUrl(filters?: PostsFilters): string {
  const searchParams = new URLSearchParams()
  if (filters?.status) searchParams.set('status', filters.status)
  if (filters?.platform) searchParams.set('platform', filters.platform)
  if (filters?.from) searchParams.set('from', filters.from)
  if (filters?.to) searchParams.set('to', filters.to)

  const query = searchParams.toString()
  return query ? `/api/posts?${query}` : '/api/posts'
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as { data?: T; error?: unknown } | null
  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : 'Une erreur est survenue')
  }
  return body?.data as T
}

async function fetchPosts(filters?: PostsFilters): Promise<PostView[]> {
  const response = await fetch(buildPostsUrl(filters))
  return readJsonResponse<PostView[]>(response)
}

async function fetchPost(id: string): Promise<PostView> {
  const response = await fetch(`/api/posts/${id}`)
  return readJsonResponse<PostView>(response)
}

async function createPost(payload: PostPayload): Promise<PostView> {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return readJsonResponse<PostView>(response)
}

async function updatePost({ id, payload }: { id: string; payload: PostPayload }): Promise<PostView> {
  const response = await fetch(`/api/posts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return readJsonResponse<PostView>(response)
}

async function deletePost(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
  return readJsonResponse<{ success: boolean }>(response)
}

async function publishPost(id: string): Promise<PostView> {
  const response = await fetch(`/api/posts/${id}/publish`, { method: 'POST' })
  return readJsonResponse<PostView>(response)
}

async function cancelPost(id: string): Promise<PostView> {
  const response = await fetch(`/api/posts/${id}/cancel`, { method: 'POST' })
  return readJsonResponse<PostView>(response)
}

export function usePosts(filters?: PostsFilters) {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: () => fetchPosts(filters),
  })
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: () => fetchPost(id),
    enabled: Boolean(id),
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updatePost,
    onSuccess: (post) => {
      queryClient.setQueryData(['posts', post.id], post)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function usePublishPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: publishPost,
    onSuccess: (post) => {
      queryClient.setQueryData(['posts', post.id], post)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useCancelPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelPost,
    onSuccess: (post) => {
      queryClient.setQueryData(['posts', post.id], post)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
