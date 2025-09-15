/**
 * Tests for MealPlanPage
 *
 * Framework/Libraries:
 * - Jest as the test runner
 * - @testing-library/react (RTL) for rendering and user interactions
 * - @testing-library/jest-dom for DOM matchers (assumed configured in setup)
 *
 * We mock:
 * - next/link to a simple anchor
 * - lucide-react icons to simple stubs
 * - @/lib/utils (getWeekStart, getDayName, formatDate, formatCookingTime) for determinism
 * - @/lib/supabase (hasValidSupabaseConfig, createSupabaseClient) to force localStorage path by default
 * - window.confirm and localStorage
 */

import React from 'react'
import { render, screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock next/link to avoid Next.js specifics in tests
jest.mock('next/link', () => {
  return ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : href?.pathname || '#'} {...rest}>{children}</a>
  )
})

// Mock lucide-react icons to simple spans to avoid SVG noise
jest.mock('lucide-react', () => {
  const iconsProxy = new Proxy({}, {
    get: (_, prop: string) => (props: any) => <span data-icon={prop} {...props} />
  })
  return iconsProxy
})

// Deterministic date helpers
let mockedBaseDate = new Date('2024-01-01T12:00:00.000Z') // Tuesday Jan 2, 2024 UTC local variations accounted via UTC usage
const oneWeekMs = 7 * 24 * 60 * 60 * 1000

const getIsoDate = (d: Date) => d.toISOString().slice(0, 10)

const getWeekStartImpl = (d: Date) => {
  // normalize to Monday-start week deterministically using UTC
  const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = u.getUTCDay() // 0..6 Sun..Sat
  const mondayOffset = (day + 6) % 7 // days since Monday
  const monday = new Date(u.getTime() - mondayOffset * 24 * 60 * 60 * 1000)
  return monday
}

const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

jest.mock('@/lib/utils', () => {
  return {
    // dynamic but deterministic based on input
    getWeekStart: (d: Date) => getWeekStartImpl(d),
    getDayName: (dayIndex: number) => dayNames[dayIndex] || `D${dayIndex}`,
    formatDate: (d: Date) => {
      // return simple YYYY-MM-DD string for assertions
      return getIsoDate(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())))
    },
    formatCookingTime: (mins: number) => `${mins} mins`
  }
})

// Force app into localStorage mode by default
const mockFrom = jest.fn()
jest.mock('@/lib/supabase', () => ({
  hasValidSupabaseConfig: jest.fn(() => false),
  createSupabaseClient: jest.fn(() => ({
    from: mockFrom
  }))
}))

// Component under test
// The real component lives at src/app/meal-plan/page.tsx; the test path mirrors that with .test.tsx
// eslint-disable-next-line import/no-relative-packages
import MealPlanPage from './page'

// LocalStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => { store[key] = String(value) },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    key: (i: number) => Object.keys(store)[i] || null,
    get length() { return Object.keys(store).length }
  }
})()

// Setup global mocks
beforeAll(() => {
  // @ts-ignore
  global.localStorage = localStorageMock
  jest.spyOn(global, 'Date')
  jest.useFakeTimers()
})
beforeEach(() => {
  localStorage.clear()
  jest.setSystemTime(mockedBaseDate)
  ;(require('@/lib/supabase').hasValidSupabaseConfig as jest.Mock).mockReturnValue(false)
})
afterAll(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

/**
 * Helper to render the page and wait basic skeleton to appear.
 */
const renderPage = () => {
  const ui = render(<MealPlanPage />)
  return ui
}

describe('MealPlanPage - basic rendering', () => {
  test('renders header, nav links, and initial week range', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: /recipe planner/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /recipes/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /meal plan/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /shopping list/i })).toBeInTheDocument()

    // Week header uses formatDate(getWeekStart(date))
    const monday = getWeekStartImpl(new Date(mockedBaseDate))
    expect(screen.getByRole('heading', { name: new RegExp(`Week of ${getIsoDate(monday)}`) })).toBeInTheDocument()
  })

  test('shows meal grid with 7 day columns and 4 meal rows', () => {
    renderPage()

    // There should be 7 day header cells + the leading "Meal" header cell
    const headerCells = screen.getAllByText(/^\d+$/) // day numbers appear as bare numbers in header grid
    expect(headerCells.length).toBeGreaterThanOrEqual(7)

    // Check meal labels
    expect(screen.getByText(/breakfast/i)).toBeInTheDocument()
    expect(screen.getByText(/lunch/i)).toBeInTheDocument()
    expect(screen.getByText(/dinner/i)).toBeInTheDocument()
    expect(screen.getByText(/snack/i)).toBeInTheDocument()
  })
})

describe('MealPlanPage - recipes loading (localStorage path)', () => {
  test('when no saved recipes, mock recipes populate modal list after opening Add Recipe', async () => {
    const user = userEvent.setup()
    renderPage()

    // Click first "Add Recipe" button to open modal
    const addButtons = await screen.findAllByRole('button', { name: /add recipe/i })
    expect(addButtons.length).toBeGreaterThan(0)
    await user.click(addButtons[0])

    // Loading then cards appear (mock list from component)
    expect(await screen.findByText(/loading recipes/i)).toBeInTheDocument()
    // After load completes, a few mock recipes should show
    const recipeButtons = await screen.findAllByRole('button', { name: /chicken stir fry|overnight oats|avocado toast|greek salad|chocolate chip cookies/i })
    expect(recipeButtons.length).toBeGreaterThanOrEqual(3)
  })

  test('gracefully handles malformed recipes in localStorage', async () => {
    const user = userEvent.setup()
    localStorage.setItem('recipes', '{not-json') // malformed

    renderPage()
    const addButtons = await screen.findAllByRole('button', { name: /add recipe/i })
    await user.click(addButtons[0])

    // Should recover and still show mock set
    const recipeButtons = await screen.findAllByRole('button', { name: /chicken stir fry|overnight oats|avocado toast|greek salad|chocolate chip cookies/i })
    expect(recipeButtons.length).toBeGreaterThanOrEqual(3)
  })
})

describe('MealPlanPage - add/remove items and persistence', () => {
  test('add a recipe into selected slot persists to localStorage', async () => {
    const user = userEvent.setup()
    renderPage()

    // Open modal from a specific cell (choose Breakfast Monday)
    const addButtons = await screen.findAllByRole('button', { name: /add recipe/i })
    await user.click(addButtons[0])

    // Choose a recipe button by title
    const recipe = await screen.findByRole('button', { name: /chicken stir fry/i })
    await user.click(recipe)

    // The card should appear in grid with servings and cooking time chips
    const card = await screen.findByText(/chicken stir fry/i)
    expect(card).toBeInTheDocument()

    // Verify storage updated
    const stored = JSON.parse(localStorage.getItem('mealPlan') || '[]')
    expect(Array.isArray(stored)).toBe(true)
    expect(stored.length).toBe(1)
    expect(stored[0]).toEqual(expect.objectContaining({
      date: expect.any(String),
      mealType: expect.any(String),
      recipe: expect.objectContaining({ title: 'Chicken Stir Fry' })
    }))
  })

  test('remove a recipe updates UI and localStorage', async () => {
    const user = userEvent.setup()
    renderPage()

    // Add one item first
    const addButtons = await screen.findAllByRole('button', { name: /add recipe/i })
    await user.click(addButtons[0])
    const recipe = await screen.findByRole('button', { name: /overnight oats/i })
    await user.click(recipe)

    const title = await screen.findByText(/overnight oats/i)
    expect(title).toBeInTheDocument()

    // Hover to reveal remove icon and click remove
    const card = title.closest('div')!
    const removeBtn = within(card).getByRole('button')
    await user.click(removeBtn)

    expect(screen.queryByText(/overnight oats/i)).not.toBeInTheDocument()
    const stored = JSON.parse(localStorage.getItem('mealPlan') || '[]')
    expect(stored).toHaveLength(0)
  })
})

describe('MealPlanPage - week navigation and clearing', () => {
  test('navigating next/prev week changes the week header', async () => {
    const user = userEvent.setup()
    renderPage()

    const headerBefore = screen.getByRole('heading', { name: /Week of/ })
    const beforeText = headerBefore.textContent || ''

    // Next week
    await user.click(screen.getByRole('button', { name: /next week/i }))
    const headerAfterNext = await screen.findByRole('heading', { name: /Week of/ })
    const nextText = headerAfterNext.textContent || ''
    expect(nextText).not.toEqual(beforeText)

    // Previous week returns to original
    await user.click(screen.getByRole('button', { name: /previous week/i }))
    const headerAfterPrev = await screen.findByRole('heading', { name: /Week of/ })
    expect(headerAfterPrev.textContent || '').toEqual(beforeText)
  })

  test('clear week removes only items from current week after confirmation', async () => {
    const user = userEvent.setup()
    // Confirm dialog control
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

    renderPage()

    // Add one item this week
    const addButtons = await screen.findAllByRole('button', { name: /add recipe/i })
    await user.click(addButtons[0])
    const recipe = await screen.findByRole('button', { name: /greek salad/i })
    await user.click(recipe)
    expect(await screen.findByText(/greek salad/i)).toBeInTheDocument()

    // Move to next week and add another item there
    await user.click(screen.getByRole('button', { name: /next week/i }))
    const addButtonsNextWeek = await screen.findAllByRole('button', { name: /add recipe/i })
    await user.click(addButtonsNextWeek[0])
    const recipe2 = await screen.findByRole('button', { name: /avocado toast/i })
    await user.click(recipe2)
    expect(await screen.findByText(/avocado toast/i)).toBeInTheDocument()

    // Return to original week and clear it
    await user.click(screen.getByRole('button', { name: /previous week/i }))
    await user.click(screen.getByRole('button', { name: /clear week/i }))

    // Item from current week removed, next-week item still persisted (but not visible on this week view)
    expect(screen.queryByText(/greek salad/i)).not.toBeInTheDocument()
    // Jump forward to ensure next-week item still exists
    await user.click(screen.getByRole('button', { name: /next week/i }))
    expect(await screen.findByText(/avocado toast/i)).toBeInTheDocument()

    confirmSpy.mockRestore()
  })

  test('Canceling clear week leaves items intact', async () => {
    const user = userEvent.setup()
    jest.spyOn(window, 'confirm').mockReturnValue(false)

    renderPage()

    const addButtons = await screen.findAllByRole('button', { name: /add recipe/i })
    await user.click(addButtons[0])
    const recipe = await screen.findByRole('button', { name: /chocolate chip cookies/i })
    await user.click(recipe)
    expect(await screen.findByText(/chocolate chip cookies/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /clear week/i }))
    // Should remain
    expect(screen.getByText(/chocolate chip cookies/i)).toBeInTheDocument()
  })
})

describe('MealPlanPage - supabase path guarded', () => {
  test('if hasValidSupabaseConfig returns true, fetch is attempted and errors handled', async () => {
    const user = userEvent.setup()
    ;(require('@/lib/supabase').hasValidSupabaseConfig as jest.Mock).mockReturnValue(true)

    // Mock supabase client chain
    const fromSelectOrder = {
      order: jest.fn(() => ({ data: [], error: null }))
    }
    mockFrom.mockReturnValue({
      select: jest.fn(() => fromSelectOrder)
    })

    renderPage()
    // Open modal to trigger recipes display (empty list state)
    const addButtons = await screen.findAllByRole('button', { name: /add recipe/i })
    await user.click(addButtons[0])

    // With empty db data -> "No recipes found" state
    expect(await screen.findByText(/no recipes found/i)).toBeInTheDocument()
  })

  test('handles supabase error by logging and showing empty state', async () => {
    const user = userEvent.setup()
    ;(require('@/lib/supabase').hasValidSupabaseConfig as jest.Mock).mockReturnValue(true)

    const errorObj = { message: 'boom' }
    const fromSelectOrder = {
      order: jest.fn(() => ({ data: null, error: errorObj }))
    }
    mockFrom.mockReturnValue({
      select: jest.fn(() => fromSelectOrder)
    })

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    renderPage()

    const addButtons = await screen.findAllByRole('button', { name: /add recipe/i })
    await user.click(addButtons[0])

    // Should still render empty state, and log error internally
    expect(await screen.findByText(/no recipes found/i)).toBeInTheDocument()
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })
})

describe('MealPlanPage - resilience of localStorage parsing and saving', () => {
  test('loadMealPlan tolerates malformed storage and resets to []', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem('mealPlan', '{oops') // malformed JSON

    renderPage()
    // No throw; internal state resets to []
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Error loading meal plan from localStorage/i),
      expect.anything()
    )
    consoleSpy.mockRestore()
  })

  test('saving mealPlan errors are caught', async () => {
    const user = userEvent.setup()
    // Simulate setItem throwing
    const origSet = localStorage.setItem
    ;(localStorage as any).setItem = jest.fn(() => { throw new Error('quota') })
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    renderPage()
    const addButtons = await screen.findAllByRole('button', { name: /add recipe/i })
    await user.click(addButtons[0])
    const recipe = await screen.findByRole('button', { name: /greek salad/i })
    await user.click(recipe)

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Error saving meal plan to localStorage/i),
      expect.anything()
    )

    // restore
    ;(localStorage as any).setItem = origSet
    consoleSpy.mockRestore()
  })
})