function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function subDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

function isTicked(logsForHabit: Record<string, boolean>, date: Date): boolean {
  return Boolean(logsForHabit[toDateKey(date)])
}

export function isFutureDay(date: Date, today: Date): boolean {
  return toDateKey(date) > toDateKey(today)
}

export function currentStreak(logsForHabit: Record<string, boolean>, today: Date): number {
  let cursor = isTicked(logsForHabit, today) ? today : subDays(today, 1)
  let count = 0
  while (isTicked(logsForHabit, cursor)) {
    count++
    cursor = subDays(cursor, 1)
  }
  return count
}
