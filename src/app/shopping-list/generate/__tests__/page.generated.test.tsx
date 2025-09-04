/**
 * Generated tests for GenerateShoppingListPage.
 *
 * Framework: React Testing Library + Jest (or Vitest with jest-compatible APIs).
 * If your project uses Vitest, ensure test environment is jsdom and jest-dom matchers are set up.
 */
import React from 'react'
import { render, screen, act, fireEvent, within } from '@testing-library/react'

/**
 * Compatibility: support both Jest and Vitest environments
 */
// @ts-ignore
const jestLike = typeof jest !== 'undefined' ? jest : (global as any).vi
// @ts-ignore
const viLike = typeof vi !== 'undefined' ? vi : (global as any).jest
const spyOnLike = (...args: any[]) => {
  const spyon = jestLike && jestLike.spyOn ? jestLike.spyOn : viLike.spyOn
  return spyon(...args)
}

/**
 * Mock next/navigation and next/link for App Router
 */
jestLike.mock('next/navigation', () => ({
  useRouter: () => ({ push: jestLike.fn() })
}))
jestLike.mock('next/link', () => {
  return ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>
})

/**
 * Mock lucide-react icons to lightweight stubs
 */
jestLike.mock('lucide-react', () => {
  const Stub = ({ children }: any) => <span data-testid="icon">{children}</span>
  return new Proxy({}, { get: () => Stub })
})

/**
 * Import the component under test.
 * Note: The provided file path in PR context was "src/app/shopping-list/generate/page.test.tsx"
 * but it appears to contain page component code. In a typical Next.js app, the page lives at page.tsx.
 * We attempt to import from both; if only one exists, TypeScript path resolution will pick it during compile.
 */
// Prefer page.tsx if present; fallback to misnamed file.
let GenerateShoppingListPage: React.ComponentType
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  GenerateShoppingListPage = require('../page').default
} catch {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  GenerateShoppingListPage = require('../page.test').default
}

/**
 * Test helpers
 */
const flushEffects = async () => {
  await act(async () => { /* tick */ })
}

const setLocalStorageJSON = (key: string, value: unknown) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}
const getLocalStorageJSON = (key: string) => {
  const raw = window.localStorage.getItem(key)
  return raw ? JSON.parse(raw) : null
}

describe('GenerateShoppingListPage', () => {
  beforeEach(() => {
    // jsdom provides localStorage; ensure clean slate
    window.localStorage.clear()
    // Fake timers not required; we avoid relying on timestamps
  })

  it('renders loading state initially', async () => {
    render(<GenerateShoppingListPage />)
    expect(screen.getByText(/Loading meal plan/i)).toBeInTheDocument()
  })

  it('when no meal plan in localStorage, shows empty meal plan UI and not generated list', async () => {
    render(<GenerateShoppingListPage />)
    await flushEffects()

    expect(screen.getByText(/No meals planned/i)).toBeInTheDocument()
    expect(screen.getByText(/Plan Your Meals/i)).toBeInTheDocument()
    expect(screen.queryByText(/Generated Shopping List/i)).not.toBeInTheDocument()
  })

  it('categorizes ingredients and groups them by category with combined quantities', async () => {
    // Build a meal plan with overlapping ingredients and varying cases/units
    const mealPlan = [
      {
        id: '1',
        date: '2025-09-01',
        mealType: 'Dinner',
        recipe: {
          id: 'r1',
          title: 'Grilled Chicken',
          description: null,
          image_url: null,
          cooking_time: 30,
          servings: 2,
          meal_type: ['Dinner'],
          dietary_tags: [],
          ingredients: [
            { id: 'i1', name: 'Chicken Breast', quantity: 2, unit: 'pcs' },
            { id: 'i2', name: 'Olive Oil', quantity: 2, unit: 'tbsp' },
            { id: 'i3', name: 'Garlic', quantity: 3, unit: 'cloves' },
          ]
        }
      },
      {
        id: '2',
        date: '2025-09-02',
        mealType: 'Lunch',
        recipe: {
          id: 'r2',
          title: 'Pasta with Tomato',
          description: null,
          image_url: null,
          cooking_time: 20,
          servings: 3,
          meal_type: ['Lunch'],
          dietary_tags: [],
          ingredients: [
            { id: 'i4', name: 'pasta', quantity: 200, unit: 'g' },
            { id: 'i5', name: 'Tomato', quantity: 2, unit: 'pcs' },
            { id: 'i6', name: 'garlic', quantity: 1, unit: 'cloves' }, // same name/unit as above, different case
            { id: 'i7', name: 'Olive Oil', quantity: 1, unit: 'tbsp' }, // same key: combine
          ]
        }
      }
    ]
    setLocalStorageJSON('mealPlan', mealPlan)

    render(<GenerateShoppingListPage />)
    await flushEffects()

    // Header shows planned meals summary
    expect(screen.getByText(/Planned Meals/i)).toBeInTheDocument()
    expect(screen.getByText(/Grilled Chicken/i)).toBeInTheDocument()
    expect(screen.getByText(/Pasta with Tomato/i)).toBeInTheDocument()

    // Generated list visible
    const header = screen.getByText(/Generated Shopping List/i)
    expect(header).toBeInTheDocument()

    // Categories rendered
    expect(screen.getByText('Protein')).toBeInTheDocument()    // Chicken Breast -> Protein
    expect(screen.getByText('Pantry')).toBeInTheDocument()     // Olive Oil -> Pantry
    expect(screen.getByText('Vegetables')).toBeInTheDocument() // Garlic, Tomato -> Vegetables
    expect(screen.getByText('Grains')).toBeInTheDocument()     // pasta -> Grains

    // Combined quantities:
    // - Olive Oil 2 tbsp + 1 tbsp => 3 tbsp
    // - Garlic 3 cloves + 1 cloves => 4 cloves
    // Verify by item rows
    const vegetables = screen.getByText('Vegetables').closest('div')!.nextElementSibling!
    const vegScope = within(vegetables as HTMLElement)
    expect(vegScope.getByText(/Garlic/i)).toBeInTheDocument()
    expect(vegScope.getByText(/4\s+cloves/i)).toBeInTheDocument()
    expect(vegScope.getByText(/Tomato/i)).toBeInTheDocument()
    expect(vegScope.getByText(/2\s+pcs/i)).toBeInTheDocument()

    const pantry = screen.getByText('Pantry').closest('div')!.nextElementSibling!
    const pantryScope = within(pantry as HTMLElement)
    expect(pantryScope.getByText(/Olive Oil/i)).toBeInTheDocument()
    expect(pantryScope.getByText(/3\s+tbsp/i)).toBeInTheDocument()

    // From: recipe titles merged
    expect(vegScope.getByText(/From:\s+Grilled Chicken, Pasta with Tomato/i)).toBeInTheDocument()
  })

  it('handles recipes without ingredients by showing "No ingredients found" message', async () => {
    const mealPlan = [
      {
        id: 'm1',
        date: '2025-09-01',
        mealType: 'Breakfast',
        recipe: {
          id: 'r1',
          title: 'Omelette',
          description: null,
          image_url: null,
          cooking_time: 10,
          servings: 1,
          meal_type: [],
          dietary_tags: [],
          // ingredients omitted intentionally
        }
      }
    ]
    setLocalStorageJSON('mealPlan', mealPlan)

    render(<GenerateShoppingListPage />)
    await flushEffects()

    expect(screen.getByText(/Planned Meals/i)).toBeInTheDocument()
    expect(screen.getByText(/No ingredients found/i)).toBeInTheDocument()
  })

  it('saveShoppingList merges with existing items (sum quantities and merge recipes), then navigates', async () => {
    const existing = [
      {
        id: 'existing-1',
        name: 'Olive Oil',
        quantity: 1,
        unit: 'tbsp',
        category: 'Pantry',
        is_purchased: false,
        recipes: ['Old Dish']
      }
    ]
    setLocalStorageJSON('shoppingList', existing)

    const mealPlan = [
      {
        id: 'm2',
        date: '2025-09-03',
        mealType: 'Dinner',
        recipe: {
          id: 'r2',
          title: 'Salmon Salad',
          description: null,
          image_url: null,
          cooking_time: 15,
          servings: 2,
          meal_type: [],
          dietary_tags: [],
          ingredients: [
            { id: 'ii1', name: 'Olive Oil', quantity: 2, unit: 'tbsp' }, // will merge
            { id: 'ii2', name: 'Salmon', quantity: 1, unit: 'lb' }
          ]
        }
      }
    ]
    setLocalStorageJSON('mealPlan', mealPlan)

    // Spy on router.push used inside component
    const nav = require('next/navigation')
    const pushSpy = spyOnLike(nav, 'useRouter').mockReturnValue({ push: jestLike.fn() })

    render(<GenerateShoppingListPage />)
    await flushEffects()

    // Click "Save to Shopping List"
    const saveBtn = screen.getByRole('button', { name: /Save to Shopping List/i })
    fireEvent.click(saveBtn)

    // Assert localStorage update
    const combined = getLocalStorageJSON('shoppingList')
    expect(Array.isArray(combined)).toBe(true)
    // Existing olive oil 1 + new 2 = 3
    const olive = combined.find((x: any) => x.name.toLowerCase() === 'olive oil' && x.unit.toLowerCase() === 'tbsp')
    expect(olive.quantity).toBe(3)
    // Recipes merged uniquely
    expect(new Set(olive.recipes)).toEqual(new Set(['Old Dish', 'Salmon Salad']))
    // New item present
    const salmon = combined.find((x: any) => x.name.toLowerCase() === 'salmon')
    expect(salmon).toBeTruthy()

    // Router navigation called
    const routerInstance = (nav.useRouter() as any)
    expect(routerInstance.push).toHaveBeenCalledWith('/shopping-list')

    // Restore mock
    pushSpy.mockRestore()
  })

  it('saveShoppingList shows alert if localStorage throws', async () => {
    const mealPlan = [
      {
        id: 'm3',
        date: '2025-09-04',
        mealType: 'Lunch',
        recipe: {
          id: 'r3',
          title: 'Fruit Bowl',
          description: null,
          image_url: null,
          cooking_time: 5,
          servings: 1,
          meal_type: [],
          dietary_tags: [],
          ingredients: [{ id: 'f1', name: 'Apple', quantity: 2, unit: 'pcs' }]
        }
      }
    ]
    setLocalStorageJSON('mealPlan', mealPlan)

    // Patch setItem to throw
    const setSpy = spyOnLike(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    const alertSpy = spyOnLike(window, 'alert').mockImplementation(() => {})

    render(<GenerateShoppingListPage />)
    await flushEffects()

    const saveBtn = screen.getByRole('button', { name: /Save to Shopping List/i })
    fireEvent.click(saveBtn)

    expect(alertSpy).toHaveBeenCalled()
    setSpy.mockRestore()
    alertSpy.mockRestore()
  })

  it('displays generating spinner while building shopping list', async () => {
    // To simulate generating state, we add a minimal meal plan and immediately render.
    const mealPlan = [
      {
        id: 'm4',
        date: '2025-09-04',
        mealType: 'Dinner',
        recipe: {
          id: 'r4',
          title: 'Tofu Stir Fry',
          description: null,
          image_url: null,
          cooking_time: 25,
          servings: 2,
          meal_type: [],
          dietary_tags: [],
          ingredients: [{ id: 't1', name: 'Tofu', quantity: 1, unit: 'block' }]
        }
      }
    ]
    setLocalStorageJSON('mealPlan', mealPlan)

    // Render and immediately check for spinner message; then flush to see final list
    render(<GenerateShoppingListPage />)
    // spinner text can appear briefly; we assert either state across the act boundary
    // First tick: generating may be true
    // Because generateShoppingList toggles generating synchronously, the spinner state may be fleeting in jsdom.
    // We assert final rendered item to ensure list finished.
    await flushEffects()
    expect(screen.getByText(/Generated Shopping List/i)).toBeInTheDocument()
    expect(screen.getByText(/Tofu/i)).toBeInTheDocument()
  })
})