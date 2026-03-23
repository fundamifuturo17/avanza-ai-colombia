import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatSalarioRange(min: number | null, max: number | null): string {
  if (!min && !max) return 'A convenir'
  if (min && !max) return `Desde ${formatCurrency(min)}`
  if (!min && max) return `Hasta ${formatCurrency(max)}`
  return `${formatCurrency(min!)} - ${formatCurrency(max!)}`
}

export function formatRelativeDate(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

export function formatDate(date: string): string {
  return format(new Date(date), 'dd MMM yyyy', { locale: es })
}

export function diasRestantes(fechaCierre: string): number {
  return differenceInDays(new Date(fechaCierre), new Date())
}

export function maskDocumentId(doc: string): string {
  if (doc.length <= 4) return '****'
  return '*'.repeat(doc.length - 4) + doc.slice(-4)
}

export function maskName(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0] + '***'
  return parts[0][0] + '*** ' + parts[parts.length - 1]
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}
