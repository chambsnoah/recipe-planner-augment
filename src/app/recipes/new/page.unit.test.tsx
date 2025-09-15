/**
 * Tests for NewRecipePage (src/app/recipes/new/page.tsx)
 *
 * Framework: React Testing Library + Jest (compatible with Vitest if configured)
 *
 * These tests cover:
 * - Initial render and defaults
 * - Field updates and array toggles (meal_type, dietary_tags)
 * - Ingredient list add/remove/update behavior
 * - Submit flow when Supabase config is invalid (localStorage fallback)
 * - Submit flow when Supabase config is valid (insert + navigate)
 * - Error paths for localStorage and Supabase insert
 *
 * All external deps are mocked: next/navigation, next/link, lucide-react, and '@/lib/supabase'.
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Under test - default export is the page component
import NewRecipePage from './page'

const mockPush = jest.fn()

// Mock next/navigation useRouter
jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock next/link to render anchors
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
}))

// Mock lucide-react icons as simple spans (to avoid SVG noise)
jest.mock('lucide-react', () => {
  const iconProxy = new Proxy({}, {
    get: (_: any, prop: string) => (props: any) => <span data-icon={prop} {...props} />,
  })
  return iconProxy
})

// Local mocks and helpers for supabase
const insertMock = jest.fn().mockResolvedValue({ error: null })
const fromMock = jest.fn(() => ({ insert: insertMock, select: jest.fn().mockReturnThis() }))

const createSupabaseClientMock = jest.fn(() => ({
  from: jest.fn(() => ({ insert: insertMock, select: jest.fn().mockReturnThis() })),
}))

let hasValidSupabaseConfigValue = false

jest.mock('@/lib/supabase', () => ({
  __esModule: true,
  createSupabaseClient: () => createSupabaseClientMock(),
  hasValidSupabaseConfig: () => hasValidSupabaseConfigValue,
}))

// JSDOM already provides localStorage, but we wrap methods to spy and simulate errors
const getItemSpy = jest.spyOn(window.localStorage.__proto__, 'getItem')
const setItemSpy = jest.spyOn(window.localStorage.__proto__, 'setItem')

// Spy on alert and console.error to verify error notifications
const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

beforeEach(() => {
  jest.clearAllMocks()
  hasValidSupabaseConfigValue = false
  // Reset localStorage to a clean state
  window.localStorage.clear()
  getItemSpy.mockImplementation((key: string) => {
    if (key === 'recipes') return JSON.stringify([])
    return null
  })
  setItemSpy.mockImplementation((key: string, value: string) => {
    // no-op mock (successful)
  })
})

describe('NewRecipePage - render and interactions', () => {
  it('renders header, default fields and one ingredient row', () => {
    render(<NewRecipePage />)

    expect(screen.getByText('Recipe Planner')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /add new recipe/i })).toBeInTheDocument()

    // Title required field present
    expect(screen.getByLabelText(/recipe title/i)).toBeInTheDocument()

    // Servings defaults to 4
    const servings = screen.getByLabelText(/servings/i) as HTMLInputElement
    expect(servings.value).toBe('4')

    // Save button not disabled initially
    const saveBtn = screen.getByRole('button', { name: /save recipe/i })
    expect(saveBtn).toBeEnabled()

    // One ingredient row exists, remove button hidden (length = 1)
    expect(screen.getByText(/ingredients/i)).toBeInTheDocument()
    expect(screen.getAllByText(/ingredient name/i)).toHaveLength(1)
    expect(screen.queryByTestId('remove-ingredient')).not.toBeInTheDocument()
  })

  it('updates basic fields and toggles meal types and dietary tags', async () => {
    const user = userEvent.setup()
    render(<NewRecipePage />)

    // Title change
    const title = screen.getByLabelText(/recipe title/i) as HTMLInputElement
    await user.clear(title)
    await user.type(title, 'My Awesome Dish')
    expect(title.value).toBe('My Awesome Dish')

    // Cooking time accepts empty (treated as null later) and number
    const cookTime = screen.getByLabelText(/cooking time/i) as HTMLInputElement
    await user.clear(cookTime)
    expect(cookTime.value).toBe('') // empty is allowed
    await user.type(cookTime, '45')
    expect(cookTime.value).toBe('45')

    // Servings change
    const servings = screen.getByLabelText(/servings/i) as HTMLInputElement
    await user.clear(servings)
    await user.type(servings, '2')
    expect(servings.value).toBe('2')

    // Toggle meal type "Breakfast"
    const breakfastBtn = screen.getByRole('button', { name: /breakfast/i })
    await user.click(breakfastBtn)
    // Should now be selected (class switch not easily asserted); re-click to toggle off
    await user.click(breakfastBtn)

    // Toggle dietary tag "Vegetarian"
    const vegetarianBtn = screen.getByRole('button', { name: /vegetarian/i })
    await user.click(vegetarianBtn)
    await user.click(vegetarianBtn) // toggle off
  })

  it('adds, updates, and removes ingredient rows correctly', async () => {
    const user = userEvent.setup()
    render(<NewRecipePage />)

    // Add new ingredient
    const addBtn = screen.getByRole('button', { name: /add ingredient/i })
    await user.click(addBtn)

    // Now two rows exist and remove buttons appear
    expect(screen.getAllByText(/ingredient name/i)).toHaveLength(2)

    // Update first ingredient name and quantity
    const nameInputs = screen.getAllByPlaceholderText(/chicken breast/i) as HTMLInputElement[]
    const qtyInputs = screen.getAllByLabelText(/quantity/i) as HTMLInputElement[]
    const unitInputs = screen.getAllByLabelText(/unit/i) as HTMLInputElement[]
    const notesInputs = screen.getAllByLabelText(/notes/i) as HTMLInputElement[]

    await user.type(nameInputs[0], 'Chicken')
    await user.clear(qtyInputs[0]); await user.type(qtyInputs[0], '1.5') // parses to 1.5
    await user.type(unitInputs[0], 'lbs')
    await user.type(notesInputs[0], 'diced')

    // Update second ingredient but keep name empty so it gets filtered out on save
    await user.clear(qtyInputs[1]); await user.type(qtyInputs[1], '') // becomes 0 via parseFloat(...) || 0
    expect(qtyInputs[1].value).toBe('') // input value may be empty; internal state sets 0

    // Remove the second ingredient
    const removeButtons = screen.getAllByRole('button', { name: '' }) // icon-only buttons
    // Identify by data-icon attribute from mocked lucide-react or by title fallback
    const removeBtn = removeButtons.find((b: HTMLElement) => b.querySelector('[data-icon="X"]')) || removeButtons[0]
    await user.click(removeBtn)

    // Back to one row
    expect(screen.getAllByText(/ingredient name/i)).toHaveLength(1)
  })
})

describe('NewRecipePage - submit behavior', () => {
  const fillMinimalValidForm = async () => {
    const user = userEvent.setup()
    const title = screen.getByLabelText(/recipe title/i) as HTMLInputElement
    await user.clear(title)
    await user.type(title, 'Saved Recipe')

    // Ensure at least one ingredient with a name to exercise filtering and payload shape
    const nameInputs = screen.getAllByPlaceholderText(/chicken breast/i) as HTMLInputElement[]
    if (nameInputs.length > 0) {
      await user.type(nameInputs[0], 'Chicken')
    }
  }

  it('falls back to localStorage when Supabase config is invalid and then navigates', async () => {
    hasValidSupabaseConfigValue = false
    render(<NewRecipePage />)

    await fillMinimalValidForm()

    // Submit
    const submitBtn = screen.getByRole('button', { name: /save recipe/i })
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith('recipes', expect.stringContaining('"title":"Saved Recipe"'))
      expect(mockPush).toHaveBeenCalledWith('/recipes')
    })

    // Loading state toggles text
    expect(screen.getByRole('button', { name: /save recipe/i })).toBeEnabled()
  })

  it('shows error alert if localStorage throws', async () => {
    hasValidSupabaseConfigValue = false
    setItemSpy.mockImplementationOnce(() => { throw new Error('storage fail') })

    render(<NewRecipePage />)
    await fillMinimalValidForm()
    await userEvent.click(screen.getByRole('button', { name: /save recipe/i }))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error saving recipe. Please try again.')
      expect(errorSpy).toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  it('inserts via Supabase when config is valid and navigates', async () => {
    hasValidSupabaseConfigValue = true
    insertMock.mockResolvedValueOnce({ error: null })
    render(<NewRecipePage />)

    await fillMinimalValidForm()

    // Leave cooking_time empty to verify it becomes null in payload.
    await userEvent.click(screen.getByRole('button', { name: /save recipe/i }))

    await waitFor(() => {
      // We cannot directly inspect the internal recipe object, but we can ensure insert was called
      expect(insertMock).toHaveBeenCalledTimes(1)
      const firstCallArgs = insertMock.mock.calls[0][0]
      expect(Array.isArray(firstCallArgs)).toBe(true)
      const row = firstCallArgs[0]
      expect(row.title).toBe('Saved Recipe')
      expect(row.cooking_time).toBeNull()
      expect(row.user_id).toBe('demo-user')
      expect(mockPush).toHaveBeenCalledWith('/recipes')
    })
  })

  it('alerts on Supabase insert error', async () => {
    hasValidSupabaseConfigValue = true
    insertMock.mockResolvedValueOnce({ error: new Error('db fail') })

    render(<NewRecipePage />)
    await fillMinimalValidForm()
    await userEvent.click(screen.getByRole('button', { name: /save recipe/i }))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error saving recipe. Please try again.')
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})