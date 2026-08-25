import { format, startOfWeek, endOfWeek, addWeeks, getISOWeek, getYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function getWeekKey(date: Date = new Date()): string {
  const week = getISOWeek(date)
  const year = getYear(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function getWeekStart(weekKey: string): Date {
  const [year, weekStr] = weekKey.split('-W')
  const week = parseInt(weekStr)
  const jan4 = new Date(parseInt(year), 0, 4)
  const startOfYear = startOfWeek(jan4, { weekStartsOn: 1 })
  return addWeeks(startOfYear, week - 1)
}

export function getWeekEnd(weekKey: string): Date {
  const start = getWeekStart(weekKey)
  return endOfWeek(start, { weekStartsOn: 1 })
}

export function navigateWeek(weekKey: string, direction: 'prev' | 'next'): string {
  const start = getWeekStart(weekKey)
  const newDate = addWeeks(start, direction === 'next' ? 1 : -1)
  return getWeekKey(newDate)
}

export function formatWeekLabel(weekKey: string): string {
  const start = getWeekStart(weekKey)
  const end = getWeekEnd(weekKey)
  const startStr = format(start, "d 'de' MMM", { locale: ptBR })
  const endStr = format(end, "d 'de' MMM", { locale: ptBR })
  return `${startStr} – ${endStr}`
}

export const DAYS_OF_WEEK = [
  { index: 1, label: 'Segunda', short: 'Seg' },
  { index: 2, label: 'Terça', short: 'Ter' },
  { index: 3, label: 'Quarta', short: 'Qua' },
  { index: 4, label: 'Quinta', short: 'Qui' },
  { index: 5, label: 'Sexta', short: 'Sex' },
  { index: 6, label: 'Sábado', short: 'Sáb' },
  { index: 0, label: 'Domingo', short: 'Dom' },
]
