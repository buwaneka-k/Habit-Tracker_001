export type Habit = {
  id: string
  name: string
  icon: string
  color: string
}

// logs[habitId][dateISO] = true means "done that day"
export type HabitLogs = Record<string, Record<string, boolean>>
