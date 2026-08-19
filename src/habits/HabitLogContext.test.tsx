import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { HabitLogProvider, useHabitLog } from './HabitLogContext'

function renderHabitLog() {
  return renderHook(() => useHabitLog(), { wrapper: HabitLogProvider })
}

describe('HabitLogContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initializes logs to an empty object when localStorage is empty', () => {
    const { result } = renderHabitLog()

    expect(result.current.logs).toEqual({})
  })

  it('marks a habit done for a given date when toggled', () => {
    const { result } = renderHabitLog()

    act(() => {
      result.current.toggleDay('exercise', '2026-08-19')
    })

    expect(result.current.logs.exercise['2026-08-19']).toBe(true)
  })

  it('unmarks a habit when toggled twice for the same date', () => {
    const { result } = renderHabitLog()

    act(() => {
      result.current.toggleDay('exercise', '2026-08-19')
    })
    act(() => {
      result.current.toggleDay('exercise', '2026-08-19')
    })

    expect(result.current.logs.exercise['2026-08-19']).toBe(false)
  })

  it('loads existing logs from localStorage on mount', () => {
    localStorage.setItem(
      'habit-tracker:logs',
      JSON.stringify({ read: { '2026-08-18': true } }),
    )

    const { result } = renderHabitLog()

    expect(result.current.logs).toEqual({ read: { '2026-08-18': true } })
  })

  it('persists the updated logs to localStorage on every change', () => {
    const { result } = renderHabitLog()

    act(() => {
      result.current.toggleDay('exercise', '2026-08-19')
    })

    expect(JSON.parse(localStorage.getItem('habit-tracker:logs')!)).toEqual({
      exercise: { '2026-08-19': true },
    })
  })
})
