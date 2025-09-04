/**
 * Tests for RecipesPage (src/app/recipes/page.tsx)
 * Testing library/framework: Jest + @testing-library/react (jsdom).
 * - Mocks next/link, '@/lib/supabase', and '@/lib/utils'
 * - Covers loading, localStorage/mock data fallback, filters, Supabase success/error, and links
 */

import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEventOrig from '@testing-library/user-event'

// Allow tests to work if userEvent isn't configured; fall back to fireEvent-like typing/clicks
const userEvent = userEventOrig.setup ? userEventOrig.setup() : (userEventOrig as any)

jest.mock('next/link', () => {
  return ({ href, children, ...rest }: any) => <a href={typeof href === 'string' ? href : String(href)} {...rest}>{children}</a>
})

/**
 * Mocks for Supabase utilities and formatting
 */
const mockCreateSupabaseClient = jest.fn()
const mockHasValidSupabaseConfig = jest.fn()
jest.mock('@/lib/supabase', () => ({
  createSupabaseClient: () => mockCreateSupabaseClient(),
  hasValidSupabaseConfig: () => mockHasValidSupabaseConfig(),
}))

const mockFormatCookingTime = jest.fn((mins: number) => `${mins} min`)
jest.mock('@/lib/utils', () => ({
  formatCookingTime: (mins: number) => mockFormatCookingTime(mins),
}))

// Import component under test after mocks
import RecipesPage from './page'

// Helpers
const getRecipeCards = () => screen.queryAllByRole('link', { name: /.+/i }).filter(a => a.getAttribute('href')?.match(/^\/recipes\/\w+$/))

// Provide JSDOM localStorage isolation per test
beforeEach(() => {
  // Clear mocks and storage
  jest.clearAllMocks()
  localStorage.clear()
})

// Use fake timers for deterministic effect queueing if needed
afterEach(() => {
  // no-op
})

describe('RecipesPage - loading state', () => {
  test('shows loading indicator initially', async () => {
    mockHasValidSupabaseConfig.mockReturnValue(false)
    render(<RecipesPage />)
    expect(screen.getByText(/Loading recipes/i)).toBeInTheDocument()
    // wait for loading to finish
    await waitFor(() => expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument())
  })
})

describe('RecipesPage - local fallback when Supabase config is invalid', () => {
  test('renders mock recipes when no saved recipes and config invalid', async () => {
    mockHasValidSupabaseConfig.mockReturnValue(false)

    render(<RecipesPage />)

    // Loading goes away
    await waitFor(() => expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument())

    // Titles from mock data should be present
    expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument()
    expect(screen.getByText('Overnight Oats')).toBeInTheDocument()
    expect(screen.getByText('Avocado Toast')).toBeInTheDocument()
    expect(screen.getByText('Greek Salad')).toBeInTheDocument()
    expect(screen.getByText('Chocolate Chip Cookies')).toBeInTheDocument()

    // Cards link to details and show edit button linking to /edit
    const chickenCardLink = screen.getByRole('link', { name: /Chicken Stir Fry/i })
    expect(chickenCardLink).toHaveAttribute('href', '/recipes/1')
    const editLinks = screen.getAllByRole('link', { name: '' }) // edit button has no accessible name
    // Verify at least one edit link points to /recipes/1/edit
    expect(editLinks.some(a => a.getAttribute('href') === '/recipes/1/edit')).toBe(true)

    // Cooking time uses formatted value when present
    expect(mockFormatCookingTime).toHaveBeenCalledWith(25)
    expect(screen.getByText(/25 min/)).toBeInTheDocument()

    // Servings text pluralization
    expect(screen.getByText(/4 servings/)).toBeInTheDocument()
    // And singular if present in dataset (Avocado Toast has 2; Overnight Oats has 1)
    expect(screen.getByText(/1 serving/)).toBeInTheDocument()
  })

  test('merges saved recipes with mock recipes without duplicates', async () => {
    mockHasValidSupabaseConfig.mockReturnValue(false)
    // Put a saved recipe with existing mock id to test de-duplication and one new saved recipe
    const saved = [
      { id: '2', title: 'Overnight Oats (Saved Override)', description: 'Saved', image_url: null, cooking_time: 5, servings: 1, meal_type: ['breakfast'], dietary_tags: ['vegetarian'] },
      { id: '100', title: 'Saved Only Recipe', description: null, image_url: null, cooking_time: null, servings: 2, meal_type: ['dinner'], dietary_tags: [] },
    ]
    localStorage.setItem('recipes', JSON.stringify(saved))

    render(<RecipesPage />)
    await waitFor(() => expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument())

    // Should include the new saved one
    expect(screen.getByText('Saved Only Recipe')).toBeInTheDocument()
    // Should still have the mock item with id=2 (original title), not overridden by saved because dedupe keeps mock when ids clash
    // The code merges [saved, ...mock.filter(id not in saved)], so it keeps saved plus mock items that are not duplicated.
    // Therefore "Overnight Oats (Saved Override)" remains (from saved) and mock "Overnight Oats" is filtered out.
    expect(screen.getByText('Overnight Oats (Saved Override)')).toBeInTheDocument()
    expect(screen.queryByText(/^Overnight Oats$/)).not.toBeInTheDocument()
  })

  test('handles corrupted localStorage gracefully', async () => {
    mockHasValidSupabaseConfig.mockReturnValue(false)
    localStorage.setItem('recipes', 'not-json')

    render(<RecipesPage />)
    await waitFor(() => expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument())

    // Renders mock data even when localStorage parsing fails
    expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument()
  })
})

describe('RecipesPage - search and filters', () => {
  test('search narrows results (case-insensitive, description included)', async () => {
    mockHasValidSupabaseConfig.mockReturnValue(false)
    render(<RecipesPage />)
    await waitFor(() => expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument())

    const search = screen.getByPlaceholderText(/Search recipes/i)
    await (userEvent?.type ? userEvent.type(search, 'oats') : Promise.resolve())

    // Overnight Oats remains, others are filtered out
    expect(screen.getByText('Overnight Oats')).toBeInTheDocument()
    expect(screen.queryByText('Chicken Stir Fry')).not.toBeInTheDocument()
  })

  test('meal type and dietary tag filters combine correctly', async () => {
    mockHasValidSupabaseConfig.mockReturnValue(false)
    render(<RecipesPage />)
    await waitFor(() => expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument())

    // Select "breakfast"
    const mealSelect = screen.getByRole('listbox', { name: '' }) // the select has no aria-label; fallback to role
    // Work with multi-select: select options programmatically
    for (const opt of (mealSelect as HTMLSelectElement).options) {
      if (opt.value === 'breakfast') {
        opt.selected = true
      }
    }
    ;(mealSelect as HTMLSelectElement).dispatchEvent(new Event('change', { bubbles: true }))

    // Select dietary 'vegetarian'
    const dietarySelects = screen.getAllByRole('listbox')
    const dietarySelect = dietarySelects.find(s => s !== mealSelect) as HTMLSelectElement
    for (const opt of dietarySelect.options) {
      if (opt.value === 'vegetarian') {
        opt.selected = true
      }
    }
    dietarySelect.dispatchEvent(new Event('change', { bubbles: true }))

    // Expect "Overnight Oats" and "Avocado Toast" (both breakfast & vegetarian)
    expect(screen.getByText('Overnight Oats')).toBeInTheDocument()
    expect(screen.getByText('Avocado Toast')).toBeInTheDocument()
    // Exclude non-breakfast like "Chicken Stir Fry"
    expect(screen.queryByText('Chicken Stir Fry')).not.toBeInTheDocument()
  })

  test('empty result UI when filters exclude all recipes', async () => {
    mockHasValidSupabaseConfig.mockReturnValue(false)
    render(<RecipesPage />)
    await waitFor(() => expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument())

    // Choose dietary "keto" which is not present in mock data
    const dietarySelect = screen.getAllByRole('listbox')[1] as HTMLSelectElement
    for (const opt of dietarySelect.options) {
      if (opt.value === 'keto') opt.selected = true
    }
    dietarySelect.dispatchEvent(new Event('change', { bubbles: true }))

    expect(screen.getByText(/No recipes found/i)).toBeInTheDocument()
    expect(screen.getByText(/Try adjusting your search or filters/i)).toBeInTheDocument()
  })
})

describe('RecipesPage - Supabase path when config is valid', () => {
  function supabaseChainResponse(resp: { data: any[] | null, error: any | null }) {
    return {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue(resp),
    }
  }

  test('renders rows returned by Supabase (success path)', async () => {
    mockHasValidSupabaseConfig.mockReturnValue(true)
    const rows = [
      { id: 'r1', title: 'DB Recipe 1', description: 'From DB', image_url: null, cooking_time: 30, servings: 2, meal_type: ['dinner'], dietary_tags: [] },
      { id: 'r2', title: 'DB Recipe 2', description: null, image_url: null, cooking_time: null, servings: 1, meal_type: ['lunch'], dietary_tags: ['vegan'] },
    ]
    mockCreateSupabaseClient.mockReturnValue(supabaseChainResponse({ data: rows, error: null }))

    render(<RecipesPage />)
    await waitFor(() => expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument())

    expect(screen.getByText('DB Recipe 1')).toBeInTheDocument()
    expect(screen.getByText('DB Recipe 2')).toBeInTheDocument()
    // Ensure fallback mock titles are not rendered in this branch
    expect(screen.queryByText('Chicken Stir Fry')).not.toBeInTheDocument()
  })

  test('logs error and renders empty state when Supabase returns error', async () => {
    mockHasValidSupabaseConfig.mockReturnValue(true)
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockCreateSupabaseClient.mockReturnValue(supabaseChainResponse({ data: null, error: new Error('boom') }))

    render(<RecipesPage />)
    await waitFor(() => expect(screen.queryByText(/Loading recipes/i)).not.toBeInTheDocument())

    expect(consoleSpy).toHaveBeenCalled()
    expect(screen.getByText(/No recipes found/i)).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})