import { clsx, type ClassValue } from 'clsx'
import { format, formatDistance } from 'date-fns'
import { fr } from 'date-fns/locale'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, pattern = 'dd MMM yyyy'): string {
  return format(new Date(date), pattern, { locale: fr })
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: fr })
}

export function formatRelativeDate(date: Date | string): string {
  return formatDistance(new Date(date), new Date(), { addSuffix: true, locale: fr })
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength)}...`
}

export function extractR2Key(url: string): string {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ''
  return url.replace(`${base}/`, '')
}
