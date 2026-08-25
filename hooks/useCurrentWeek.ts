'use client'

import { useState, useCallback } from 'react'
import { getWeekKey, navigateWeek } from '@/lib/weeks'

export function useCurrentWeek() {
  const [weekKey, setWeekKey] = useState(() => getWeekKey())
  const todayKey = getWeekKey()

  const goToPrev = useCallback(() => setWeekKey(k => navigateWeek(k, 'prev')), [])
  const goToNext = useCallback(() => setWeekKey(k => navigateWeek(k, 'next')), [])
  const goToToday = useCallback(() => setWeekKey(todayKey), [todayKey])

  const isCurrentWeek = weekKey === todayKey
  const isPastWeek = weekKey < todayKey

  return { weekKey, goToPrev, goToNext, goToToday, isCurrentWeek, isPastWeek }
}
