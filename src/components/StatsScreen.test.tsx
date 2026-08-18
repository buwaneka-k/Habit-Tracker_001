import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { HabitLogProvider } from '../habits/HabitLogContext'
import { StatsScreen } from './StatsScreen'

const STORAGE_KEY = 'habit-tracker:logs'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.useRealTimers()
})

function renderStats() {
  return render(
    <HabitLogProvider>
      <StatsScreen />
    </HabitLogProvider>,
  )
}

describe('StatsScreen', () => {
  it("renders the Exercise habit's name", () => {
    renderStats()

    expect(screen.getByText(/Exercise/)).toBeInTheDocument()
  })

  it("also renders the Read habit's name", () => {
    renderStats()

    expect(screen.getByText(/Read/)).toBeInTheDocument()
  })

  it("renders the Exercise habit's icon", () => {
    renderStats()

    expect(screen.getByText('🏃')).toBeInTheDocument()
  })

  it("renders the Exercise icon badge in the habit's accent color", () => {
    renderStats()

    expect(screen.getByText('🏃')).toHaveStyle({ backgroundColor: '#e76f51' })
  })

  it('shows a 0 days streak for Exercise when there are no logged days', () => {
    renderStats()

    expect(screen.getByTestId('streak-exercise')).toHaveTextContent('0 days streak')
  })

  it('shows a singular "day" streak when the streak is exactly 1', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 19))
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ exercise: { '2026-08-19': true } }))

    renderStats()

    expect(screen.getByTestId('streak-exercise')).toHaveTextContent('1 day streak')
  })

  it('renders every seed habit with its own correct current streak from preloaded log data', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 19))
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        exercise: { '2026-08-18': true, '2026-08-17': true, '2026-08-16': true },
        read: {},
        meditate: { '2026-08-19': true },
        'drink-water': { '2026-08-19': true, '2026-08-18': true },
        'sleep-8-hours': {
          '2026-08-19': true,
          '2026-08-18': true,
          '2026-08-17': true,
          '2026-08-16': true,
          '2026-08-15': true,
        },
      }),
    )

    renderStats()

    expect(screen.getByTestId('streak-exercise')).toHaveTextContent('3 days streak')
    expect(screen.getByTestId('streak-read')).toHaveTextContent('0 days streak')
    expect(screen.getByTestId('streak-meditate')).toHaveTextContent('1 day streak')
    expect(screen.getByTestId('streak-drink-water')).toHaveTextContent('2 days streak')
    expect(screen.getByTestId('streak-sleep-8-hours')).toHaveTextContent('5 days streak')
  })
})
