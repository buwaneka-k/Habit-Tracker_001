import { describe, expect, it } from 'vitest'
import { currentStreak, isFutureDay } from './streak'

describe('currentStreak', () => {
  it('returns 0 when no days are ticked', () => {
    const today = new Date(2026, 7, 19) // 2026-08-19
    expect(currentStreak({}, today)).toBe(0)
  })

  it('counts a streak ending today', () => {
    const today = new Date(2026, 7, 19)
    const logs = {
      '2026-08-19': true,
      '2026-08-18': true,
      '2026-08-17': true,
    }
    expect(currentStreak(logs, today)).toBe(3)
  })

  it('counts a streak ending yesterday when today is untouched (grace rule)', () => {
    const today = new Date(2026, 7, 19)
    const logs = {
      '2026-08-18': true,
      '2026-08-17': true,
    }
    expect(currentStreak(logs, today)).toBe(2)
  })

  it('stops counting at a gap (broken streak)', () => {
    const today = new Date(2026, 7, 19)
    const logs = {
      '2026-08-18': true,
      '2026-08-17': false,
      '2026-08-16': true,
    }
    expect(currentStreak(logs, today)).toBe(1)
  })

  it('returns 0 when today is explicitly marked not-done and yesterday is also unticked', () => {
    const today = new Date(2026, 7, 19)
    const logs = {
      '2026-08-19': false,
      '2026-08-18': false,
    }
    expect(currentStreak(logs, today)).toBe(0)
  })
})

describe('isFutureDay', () => {
  it('returns true for tomorrow', () => {
    const today = new Date(2026, 7, 19)
    const tomorrow = new Date(2026, 7, 20)
    expect(isFutureDay(tomorrow, today)).toBe(true)
  })

  it('returns false for today', () => {
    const today = new Date(2026, 7, 19)
    expect(isFutureDay(today, today)).toBe(false)
  })

  it('returns false for yesterday', () => {
    const today = new Date(2026, 7, 19)
    const yesterday = new Date(2026, 7, 18)
    expect(isFutureDay(yesterday, today)).toBe(false)
  })
})
