import { describe, expect, it } from 'vitest'
import { seedHabits } from './seedData'

describe('seedHabits', () => {
  it('contains the 5 fixed habits with their icon and accent color', () => {
    expect(seedHabits).toEqual([
      { id: 'exercise', name: 'Exercise', icon: '🏃', color: '#e76f51' },
      { id: 'read', name: 'Read', icon: '📚', color: '#457b9d' },
      { id: 'meditate', name: 'Meditate', icon: '🧘', color: '#8e7dbe' },
      { id: 'drink-water', name: 'Drink Water', icon: '💧', color: '#2a9d8f' },
      { id: 'sleep-8-hours', name: 'Sleep 8 Hours', icon: '😴', color: '#264653' },
    ])
  })
})
