import { useState } from 'react'
import { HabitLogProvider } from './habits/HabitLogContext'
import { MonthGrid } from './components/MonthGrid'
import { StatsScreen } from './components/StatsScreen'

type View = 'month' | 'stats'

function App() {
  const [view, setView] = useState<View>('month')

  return (
    <HabitLogProvider>
      <main>
        <h1>Habit Tracker</h1>
        <nav>
          <button type="button" onClick={() => setView('month')}>
            Month
          </button>
          <button type="button" onClick={() => setView('stats')}>
            Stats
          </button>
        </nav>
        {view === 'month' ? <MonthGrid /> : <StatsScreen />}
      </main>
    </HabitLogProvider>
  )
}

export default App
