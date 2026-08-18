import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the habit tracker heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Habit Tracker' })).toBeInTheDocument()
  })

  it('shows the Month view by default', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Next month' })).toBeInTheDocument()
  })

  it('switches to the Stats view when the Stats tab is clicked', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Stats' }))

    expect(screen.queryByRole('button', { name: 'Next month' })).not.toBeInTheDocument()
    expect(screen.getByTestId('streak-exercise')).toBeInTheDocument()
  })

  it('switches back to the Month view when the Month tab is clicked', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Stats' }))
    fireEvent.click(screen.getByRole('button', { name: 'Month' }))

    expect(screen.getByRole('button', { name: 'Next month' })).toBeInTheDocument()
    expect(screen.queryByTestId('streak-exercise')).not.toBeInTheDocument()
  })
})
