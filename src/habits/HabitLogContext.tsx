import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import type { HabitLogs } from './types'

const STORAGE_KEY = 'habit-tracker:logs'

type ToggleDayAction = { type: 'TOGGLE_DAY'; habitId: string; dateISO: string }

function habitLogReducer(state: HabitLogs, action: ToggleDayAction): HabitLogs {
  switch (action.type) {
    case 'TOGGLE_DAY': {
      const habitLog = state[action.habitId] ?? {}
      return {
        ...state,
        [action.habitId]: {
          ...habitLog,
          [action.dateISO]: !habitLog[action.dateISO],
        },
      }
    }
  }
}

function loadInitialLogs(): HabitLogs {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : {}
}

type HabitLogContextValue = {
  logs: HabitLogs
  toggleDay: (habitId: string, dateISO: string) => void
}

const HabitLogContext = createContext<HabitLogContextValue | null>(null)

export function HabitLogProvider({ children }: { children: ReactNode }) {
  const [logs, dispatch] = useReducer(habitLogReducer, undefined, loadInitialLogs)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  }, [logs])

  const toggleDay = (habitId: string, dateISO: string) => {
    dispatch({ type: 'TOGGLE_DAY', habitId, dateISO })
  }

  return (
    <HabitLogContext.Provider value={{ logs, toggleDay }}>
      {children}
    </HabitLogContext.Provider>
  )
}

export function useHabitLog(): HabitLogContextValue {
  const context = useContext(HabitLogContext)
  if (!context) {
    throw new Error('useHabitLog must be used within a HabitLogProvider')
  }
  return context
}
