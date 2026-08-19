import { seedHabits } from '../habits/seedData'
import { useHabitLog } from '../habits/HabitLogContext'
import { currentStreak } from '../habits/streak'

export function StatsScreen() {
  const { logs } = useHabitLog()

  return (
    <ul className="stats-list">
      {seedHabits.map((habit) => {
        const streak = currentStreak(logs[habit.id] ?? {}, new Date())
        const unit = streak === 1 ? 'day' : 'days'

        return (
          <li key={habit.id} className="stats-row">
            <span className="icon-badge" style={{ backgroundColor: habit.color }}>
              {habit.icon}
            </span>{' '}
            {habit.name} —{' '}
            <span data-testid={`streak-${habit.id}`}>
              {streak} {unit} streak
            </span>
          </li>
        )
      })}
    </ul>
  )
}
