/**
 * Test library and framework: React Testing Library with Jest (jsdom).
 * If the repository uses Vitest, these tests are compatible with minimal changes
 * (e.g., vi instead of jest). We follow existing conventions discovered in the repo.
 */
import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecipeDetailPage from './page'

/**
 * Mocks
 */
jest.mock('next/link', () => {
  // Preserve Link behavior in tests
  return ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>
})

/**
 * Mock next/navigation for useParams and useRouter
 */
const pushMock = jest.fn()
const mockParams: Record<string, string> = { id: '1' }

jest.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push: pushMock }),
}))

/**
 * Mock lucide-react icons as simple stubs to avoid SVG noise
 */
jest.mock('lucide-react', () => {
  const Stub = ({ children }: any) => <span data-testid="icon">{children}</span>
  return {
    ChefHat: Stub,
    Clock: Stub,
    Users: Stub,
    ArrowLeft: Stub,
    Edit: Stub,
    ExternalLink: Stub,
  }
})

/**
 * Mock Supabase utilities
 */
const hasValidSupabaseConfigMock = jest.fn()
const fromSelectSingleMock = jest.fn()
const supabaseFromMock = jest.fn(() => ({
  select: () => ({
    eq: () => ({ single: fromSelectSingleMock }),
  }),
}))
const createSupabaseClientMock = jest.fn(() => ({
  from: supabaseFromMock,
}))

jest.mock('@/lib/supabase', () => ({
  hasValidSupabaseConfig: () => hasValidSupabaseConfigMock(),
  createSupabaseClient: () => createSupabaseClientMock(),
}))

/**
 * Mock formatCookingTime
 */
const formatCookingTimeMock = jest.fn((m: number) => `${m} mins`)
jest.mock('@/lib/utils', () => ({
  formatCookingTime: (m: number) => formatCookingTimeMock(m),
}))

/**
 * Helpers
 */
const flushPromises = () => new Promise(setImmediate)

beforeEach(() => {
  jest.clearAllMocks()
  // @ts-expect-error - jsdom provides localStorage
  window.localStorage.clear()
  mockParams.id = '1'
})

describe('RecipeDetailPage', () => {
  test('shows loading state initially', async () => {
    hasValidSupabaseConfigMock.mockReturnValue(false)

    render(<RecipeDetailPage />)
    expect(screen.getByText(/Loading recipe/i)).toBeInTheDocument()

    await waitFor(() => {
      // After fetch completes, loading should disappear
      expect(screen.queryByText(/Loading recipe/i)).not.toBeInTheDocument()
    })
  })

  test('loads recipe from localStorage when Supabase config is invalid', async () => {
    hasValidSupabaseConfigMock.mockReturnValue(false)

    const savedRecipes = [
      {
        id: '1',
        title: 'Saved Chicken',
        description: 'Saved desc',
        image_url: null,
        external_url: null,
        cooking_time: 30,
        servings: 2,
        meal_type: ['dinner'],
        dietary_tags: ['gluten-free'],
        ingredients: [
          { id: 'ing1', name: 'Chicken', quantity: 1, unit: 'lb', notes: 'strips' },
        ],
      },
    ]
    window.localStorage.setItem('recipes', JSON.stringify(savedRecipes))

    render(<RecipeDetailPage />)

    // Title from saved recipe should appear
    expect(await screen.findByRole('heading', { name: /Saved Chicken/i })).toBeInTheDocument()
    // Description
    expect(screen.getByText(/Saved desc/i)).toBeInTheDocument()
    // Cooking time formatted
    expect(formatCookingTimeMock).toHaveBeenCalledWith(30)
    expect(screen.getByText(/30 mins/i)).toBeInTheDocument()
    // Servings pluralization
    expect(screen.getByText('2 servings')).toBeInTheDocument()
    // Meal type capitalized
    expect(screen.getByText('Dinner')).toBeInTheDocument()
    // Dietary tag capitalized
    expect(screen.getByText('Gluten-free')).toBeInTheDocument()
    // Ingredients rendered
    const ingredients = screen.getByRole('heading', { name: /Ingredients/i })
    const container = ingredients.closest('.bg-white') || document.body
    expect(within(container!).getByText(/Chicken/)).toBeInTheDocument()
    expect(within(container!).getByText(/1 lb/)).toBeInTheDocument()
    expect(within(container!).getByText(/\(strips\)/)).toBeInTheDocument()
  })

  test('falls back to built-in mock recipes when localStorage lacks the id', async () => {
    hasValidSupabaseConfigMock.mockReturnValue(false)
    window.localStorage.setItem('recipes', JSON.stringify([]))
    mockParams.id = '2'

    render(<RecipeDetailPage />)
    // Mock with id '2' is "Overnight Oats" per component code
    expect(await screen.findByRole('heading', { name: /Overnight Oats/i })).toBeInTheDocument()
    // cooking_time 5 -> formatted
    expect(formatCookingTimeMock).toHaveBeenCalledWith(5)
    expect(screen.getByText(/5 mins/)).toBeInTheDocument()
    // Servings 1 -> singular
    expect(screen.getByText('1 serving')).toBeInTheDocument()
    // Meal type Breakfast capitalized
    expect(screen.getByText('Breakfast')).toBeInTheDocument()
    // Dietary tag Vegetarian capitalized
    expect(screen.getByText('Vegetarian')).toBeInTheDocument()
  })

  test('navigates to /recipes when recipe is not found in local storage or mocks', async () => {
    hasValidSupabaseConfigMock.mockReturnValue(false)
    window.localStorage.setItem('recipes', JSON.stringify([]))
    mockParams.id = '999' // not present in built-in mocks

    render(<RecipeDetailPage />)
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/recipes')
    })
  })

  test('when image_url present renders img with alt text; otherwise shows placeholder icon', async () => {
    hasValidSupabaseConfigMock.mockReturnValue(false)
    window.localStorage.setItem('recipes', JSON.stringify([
      {
        id: '1',
        title: 'With Image',
        description: null,
        image_url: 'https://example.com/foo.jpg',
        external_url: null,
        cooking_time: null,
        servings: 3,
        meal_type: [],
        dietary_tags: [],
        ingredients: [],
      },
    ]))

    render(<RecipeDetailPage />)
    const img = await screen.findByRole('img', { name: /With Image/i })
    expect(img).toHaveAttribute('src', 'https://example.com/foo.jpg')

    // Update to no image
    beforeEach(() => {})
  })

  test('renders "No ingredients listed" when ingredients are empty', async () => {
    hasValidSupabaseConfigMock.mockReturnValue(false)
    window.localStorage.setItem('recipes', JSON.stringify([
      {
        id: '1',
        title: 'No Ingredients',
        description: null,
        image_url: null,
        external_url: null,
        cooking_time: null,
        servings: 1,
        meal_type: [],
        dietary_tags: [],
        ingredients: [],
      },
    ]))

    render(<RecipeDetailPage />)
    expect(await screen.findByText(/No ingredients listed for this recipe/i)).toBeInTheDocument()
  })

  test('renders external link when external_url is provided', async () => {
    hasValidSupabaseConfigMock.mockReturnValue(false)
    window.localStorage.setItem('recipes', JSON.stringify([
      {
        id: '1',
        title: 'Ext Link',
        description: null,
        image_url: null,
        external_url: 'https://example.com/recipe',
        cooking_time: null,
        servings: 1,
        meal_type: [],
        dietary_tags: [],
        ingredients: [],
      },
    ]))

    render(<RecipeDetailPage />)
    const link = await screen.findByRole('link', { name: /View Original Recipe/i })
    expect(link).toHaveAttribute('href', 'https://example.com/recipe')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  test('Edit Recipe link points to /recipes/:id/edit', async () => {
    hasValidSupabaseConfigMock.mockReturnValue(false)
    window.localStorage.setItem('recipes', JSON.stringify([
      {
        id: '1',
        title: 'Editable',
        description: null,
        image_url: null,
        external_url: null,
        cooking_time: null,
        servings: 1,
        meal_type: [],
        dietary_tags: [],
        ingredients: [],
      },
    ]))

    render(<RecipeDetailPage />)
    const link = await screen.findByRole('link', { name: /Edit Recipe/i })
    expect(link).toHaveAttribute('href', '/recipes/1/edit')
  })

  test('Supabase path: loads recipe when config is valid and query succeeds', async () => {
    hasValidSupabaseConfigMock.mockReturnValue(true)
    fromSelectSingleMock.mockResolvedValue({
      data: {
        id: '1',
        title: 'From Supabase',
        description: 'desc',
        image_url: null,
        external_url: null,
        cooking_time: 42,
        servings: 4,
        meal_type: ['lunch'],
        dietary_tags: ['vegan'],
        ingredients: [{ id: 'i1', name: 'Tofu', quantity: 2, unit: 'blocks', notes: '' }],
      },
      error: null,
    } as any)

    render(<RecipeDetailPage />)

    expect(await screen.findByRole('heading', { name: /From Supabase/i })).toBeInTheDocument()
    expect(formatCookingTimeMock).toHaveBeenCalledWith(42)
    expect(screen.getByText(/42 mins/)).toBeInTheDocument()
    expect(screen.getByText('Lunch')).toBeInTheDocument()
    expect(screen.getByText('Vegan')).toBeInTheDocument()
    expect(screen.getByText('4 servings')).toBeInTheDocument()
    expect(screen.getByText(/Tofu/)).toBeInTheDocument()
  })

  test('Supabase path: navigates to /recipes when query throws error', async () => {
    hasValidSupabaseConfigMock.mockReturnValue(true)
    fromSelectSingleMock.mockResolvedValue({
      data: null,
      error: new Error('boom'),
    } as any)

    render(<RecipeDetailPage />)
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/recipes')
    })
  })
})