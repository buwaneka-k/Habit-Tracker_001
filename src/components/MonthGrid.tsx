import { useState } from 'react'
import { useHabitLog } from '../habits/HabitLogContext'
import { seedHabits } from '../habits/seedData'
import { isFutureDay } from '../habits/streak'

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'long' })

function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

type MonthGridProps = {
  today?: Date
}

export function MonthGrid({ today = new Date() }: MonthGridProps) {
  const { logs, toggleDay } = useHabitLog()
  const [viewedMonth, setViewedMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const year = viewedMonth.getFullYear()
  const month = viewedMonth.getMonth()
  const numDays = daysInMonth(year, month)
  const days = Array.from({ length: numDays }, (_, i) => i + 1)

  const goToPrevMonth = () => setViewedMonth(new Date(year, month - 1, 1))
  const goToNextMonth = () => setViewedMonth(new Date(year, month + 1, 1))

  return (
    <div className="month-grid">
      <div className="month-header">
        <button type="button" aria-label="Previous month" onClick={goToPrevMonth}>
          &lt;
        </button>
        <span>
          {MONTH_FORMATTER.format(viewedMonth)} {year}
        </span>
        <button type="button" aria-label="Next month" onClick={goToNextMonth}>
          &gt;
        </button>
      </div>
      {seedHabits.map((habit) => (
        <div key={habit.id} className="habit-row">
          <span className="habit-label">
            {habit.icon} {habit.name}
          </span>
          {days.map((day) => {
            const date = new Date(year, month, day)
            const dateKey = toDateKey(date)
            const future = isFutureDay(date, today)
            const ticked = Boolean(logs[habit.id]?.[dateKey])

            return (
              <button
                key={dateKey}
                type="button"
                className="day-cell"
                aria-label={`${habit.name} ${dateKey}`}
                aria-pressed={ticked}
                disabled={future}
                style={{
                  backgroundColor: ticked ? habit.color : undefined,
                  opacity: future ? 0.4 : 1,
                }}
                {...(!future ? { onClick: () => toggleDay(habit.id, dateKey) } : {})}
              >
                {day}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
