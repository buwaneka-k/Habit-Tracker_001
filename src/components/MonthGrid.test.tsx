import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { HabitLogProvider } from '../habits/HabitLogContext'
import { seedHabits } from '../habits/seedData'
import { MonthGrid } from './MonthGrid'

function renderMonthGrid(today?: Date) {
  return render(
    <HabitLogProvider>
      <MonthGrid today={today} />
    </HabitLogProvider>,
  )
}

describe('MonthGrid', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders a row for each seed habit with its icon and name', () => {
    renderMonthGrid()

    for (const habit of seedHabits) {
      expect(screen.getByText(`${habit.icon} ${habit.name}`)).toBeInTheDocument()
    }
  })

  it('renders a header with the currently-viewed month and year', () => {
    renderMonthGrid(new Date(2026, 7, 19))

    expect(screen.getByText('August 2026')).toBeInTheDocument()
  })

  it('renders a day cell for every day in the currently-viewed month', () => {
    renderMonthGrid(new Date(2026, 7, 19)) // August 2026 has 31 days

    expect(screen.getAllByRole('button', { name: /^Exercise 2026-08-\d\d$/ })).toHaveLength(31)
  })

  it('disables future-day cells', () => {
    renderMonthGrid(new Date(2026, 7, 19))

    expect(screen.getByRole('button', { name: 'Exercise 2026-08-20' })).toBeDisabled()
  })

  it('does not disable past or today cells', () => {
    renderMonthGrid(new Date(2026, 7, 19))

    expect(screen.getByRole('button', { name: 'Exercise 2026-08-19' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Exercise 2026-08-01' })).not.toBeDisabled()
  })

  it('clicking a past/today cell ticks it and marks it pressed', () => {
    renderMonthGrid(new Date(2026, 7, 19))

    const cell = screen.getByRole('button', { name: 'Exercise 2026-08-19' })
    expect(cell).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(cell)

    expect(cell).toHaveAttribute('aria-pressed', 'true')
  })

  it('fills a ticked cell with the habit accent color', () => {
    renderMonthGrid(new Date(2026, 7, 19))

    const cell = screen.getByRole('button', { name: 'Exercise 2026-08-19' })
    const exerciseHabit = seedHabits.find((habit) => habit.id === 'exercise')!

    fireEvent.click(cell)

    expect(cell).toHaveStyle({ backgroundColor: exerciseHabit.color })
  })

  it('clicking a future-day cell is a no-op', () => {
    renderMonthGrid(new Date(2026, 7, 19))

    const cell = screen.getByRole('button', { name: 'Exercise 2026-08-20' })

    fireEvent.click(cell)

    expect(cell).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders future-day cells with reduced opacity', () => {
    renderMonthGrid(new Date(2026, 7, 19))

    const futureCell = screen.getByRole('button', { name: 'Exercise 2026-08-20' })
    const pastCell = screen.getByRole('button', { name: 'Exercise 2026-08-19' })

    expect(futureCell.style.opacity).not.toBe('')
    expect(futureCell.style.opacity).not.toBe(pastCell.style.opacity)
  })

  it('clicking Next advances the header to the next month', () => {
    renderMonthGrid(new Date(2026, 7, 19))

    fireEvent.click(screen.getByRole('button', { name: 'Next month' }))

    expect(screen.getByText('September 2026')).toBeInTheDocument()
  })

  it('clicking Prev moves the header back a month', () => {
    renderMonthGrid(new Date(2026, 7, 19))

    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))

    expect(screen.getByText('July 2026')).toBeInTheDocument()
  })

  it('shows the correct number of day cells after navigating to a shorter month', () => {
    renderMonthGrid(new Date(2026, 7, 19)) // August has 31 days

    fireEvent.click(screen.getByRole('button', { name: 'Next month' })) // September has 30 days

    expect(screen.getAllByRole('button', { name: /^Exercise 2026-09-\d\d$/ })).toHaveLength(30)
  })

  it('disables every cell after navigating to a future month', () => {
    renderMonthGrid(new Date(2026, 7, 19))

    fireEvent.click(screen.getByRole('button', { name: 'Next month' })) // September 2026 is entirely future

    const septemberCells = screen.getAllByRole('button', { name: /^Exercise 2026-09-\d\d$/ })
    expect(septemberCells).toHaveLength(30)
    for (const cell of septemberCells) {
      expect(cell).toBeDisabled()
    }
  })

  it('toggling one habit cell does not affect another habit on the same day', () => {
    renderMonthGrid(new Date(2026, 7, 19))

    fireEvent.click(screen.getByRole('button', { name: 'Exercise 2026-08-19' }))

    expect(screen.getByRole('button', { name: 'Read 2026-08-19' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('remains editable for a day in a previously-viewed past month', () => {
    renderMonthGrid(new Date(2026, 7, 19))

    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))
    const cell = screen.getByRole('button', { name: 'Exercise 2026-07-05' })
    expect(cell).not.toBeDisabled()

    fireEvent.click(cell)

    expect(cell).toHaveAttribute('aria-pressed', 'true')
  })
})
