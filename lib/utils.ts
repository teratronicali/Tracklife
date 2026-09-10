import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatMoney(value: number, currency: string = 'USD') {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('es-CO').format(value || 0)
}

export function toISODate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function lastNDates(n: number) {
  const dates: string[] = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dates.push(toISODate(d))
  }
  return dates
}

export const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
