'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChefHat, Calendar, Plus, ChevronLeft, ChevronRight, X, Clock, Users, Trash2 } from 'lucide-react'
import { getDayName, getWeekStart, formatDate, formatCookingTime } from '@/lib/utils'
import { createSupabaseClient, hasValidSupabaseConfig } from '@/lib/supabase'

interface Recipe {
  id: string
  title: string
  description: string | null
  image_url: string | null
  cooking_time: number | null
  servings: number
  meal_type: string[]
  dietary_tags: string[]
  ingredients?: Array<{
    id: string
    name: string
    quantity: number
    unit: string
    notes?: string
  }>
}

interface MealPlanItem {
  id: string
  recipe: Recipe
  date: string
  mealType: string
}

/**
 * Meal Plan page component that renders a weekly meal-planning UI.
 *
 * Renders a week-view grid of meals (breakfast, lunch, dinner, snack), controls for week navigation,
 * quick action links, and a modal for selecting recipes to add to specific day/meal slots.
 *
 * Side effects:
 * - Loads recipes from Supabase when configured; otherwise merges mock recipes with any saved recipes from localStorage.
 * - Loads and persists the user's meal plan to localStorage.
 *
 * Interaction notes:
 * - Selecting "Add Recipe" opens a modal to pick a recipe for a chosen date and meal type.
 * - Adding/removing recipes updates the in-memory meal plan and persists changes to localStorage.
 *
 * @returns The Meal Plan page React element.
 */
export default function MealPlanPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [mealPlan, setMealPlan] = useState<MealPlanItem[]>([])
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{date: string, mealType: string} | null>(null)
  const [loading, setLoading] = useState(true)

  const weekStart = getWeekStart(currentWeek)
  const supabase = createSupabaseClient()

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return date
  })

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']

  useEffect(() => {
    loadRecipes()
    loadMealPlan()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Reload meal plan when week changes
    loadMealPlan()
  }, [currentWeek])

  const loadRecipes = async () => {
    try {
      if (!hasValidSupabaseConfig()) {
        // Load from localStorage and mock data
        let savedRecipes = []
        try {
          savedRecipes = JSON.parse(localStorage.getItem('recipes') || '[]')
        } catch (error) {
          console.error('Error loading recipes from localStorage:', error)
          savedRecipes = []
        }
        const mockRecipes = [
          {
            id: '1',
            title: 'Chicken Stir Fry',
            description: 'Quick and healthy chicken stir fry with vegetables',
            image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
            cooking_time: 25,
            servings: 4,
            meal_type: ['dinner'],
            dietary_tags: ['gluten-free'],
            ingredients: [
              { id: '1', name: 'Chicken breast', quantity: 1, unit: 'lb', notes: 'cut into strips' },
              { id: '2', name: 'Mixed vegetables', quantity: 2, unit: 'cups', notes: 'frozen or fresh' },
              { id: '3', name: 'Tamari (gluten-free)', quantity: 3, unit: 'tbsp', notes: 'use gluten-free tamari or coconut aminos as a soy sauce alternative' },
              { id: '4', name: 'Garlic', quantity: 2, unit: 'cloves', notes: 'minced' }
            ]
          },
          {
            id: '2',
            title: 'Overnight Oats',
            description: 'Easy breakfast prep with oats, milk, and fruits',
            image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
            cooking_time: 5,
            servings: 1,
            meal_type: ['breakfast'],
            dietary_tags: ['vegetarian'],
            ingredients: [
              { id: '1', name: 'Rolled oats', quantity: 0.5, unit: 'cup', notes: '' },
              { id: '2', name: 'Milk', quantity: 0.5, unit: 'cup', notes: 'any type' },
              { id: '3', name: 'Chia seeds', quantity: 1, unit: 'tbsp', notes: '' },
              { id: '4', name: 'Honey', quantity: 1, unit: 'tsp', notes: 'or maple syrup' },
              { id: '5', name: 'Berries', quantity: 0.25, unit: 'cup', notes: 'fresh or frozen' }
            ]
          },
          {
            id: '3',
            title: 'Avocado Toast',
            description: 'Simple and nutritious avocado toast with toppings',
            image_url: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&h=300&fit=crop',
            cooking_time: 10,
            servings: 2,
            meal_type: ['breakfast', 'lunch'],
            dietary_tags: ['vegetarian', 'vegan'],
            ingredients: [
              { id: '1', name: 'Bread', quantity: 2, unit: 'slices', notes: 'whole grain' },
              { id: '2', name: 'Avocado', quantity: 1, unit: 'large', notes: 'ripe' },
              { id: '3', name: 'Lemon juice', quantity: 1, unit: 'tsp', notes: 'fresh' },
              { id: '4', name: 'Salt', quantity: 0.25, unit: 'tsp', notes: 'to taste' },
              { id: '5', name: 'Black pepper', quantity: 0.125, unit: 'tsp', notes: 'to taste' }
            ]
          },
          {
            id: '4',
            title: 'Greek Salad',
            description: 'Fresh Mediterranean salad with feta cheese',
            image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop',
            cooking_time: 15,
            servings: 4,
            meal_type: ['lunch', 'dinner'],
            dietary_tags: ['vegetarian', 'gluten-free'],
            ingredients: [
              { id: '1', name: 'Cucumber', quantity: 1, unit: 'large', notes: 'diced' },
              { id: '2', name: 'Tomatoes', quantity: 2, unit: 'large', notes: 'chopped' },
              { id: '3', name: 'Red onion', quantity: 0.5, unit: 'medium', notes: 'sliced' },
              { id: '4', name: 'Feta cheese', quantity: 4, unit: 'oz', notes: 'crumbled' },
              { id: '5', name: 'Olive oil', quantity: 3, unit: 'tbsp', notes: 'extra virgin' },
              { id: '6', name: 'Lemon juice', quantity: 2, unit: 'tbsp', notes: 'fresh' }
            ]
          },
          {
            id: '5',
            title: 'Chocolate Chip Cookies',
            description: 'Classic homemade chocolate chip cookies',
            image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=300&fit=crop',
            cooking_time: 45,
            servings: 24,
            meal_type: ['dessert', 'snack'],
            dietary_tags: ['vegetarian'],
            ingredients: [
              { id: '1', name: 'All-purpose flour', quantity: 2.25, unit: 'cups', notes: '' },
              { id: '2', name: 'Butter', quantity: 1, unit: 'cup', notes: 'softened' },
              { id: '3', name: 'Brown sugar', quantity: 0.75, unit: 'cup', notes: 'packed' },
              { id: '4', name: 'White sugar', quantity: 0.75, unit: 'cup', notes: '' },
              { id: '5', name: 'Eggs', quantity: 2, unit: 'large', notes: '' },
              { id: '6', name: 'Chocolate chips', quantity: 2, unit: 'cups', notes: 'semi-sweet' }
            ]
          }
        ]

        const allRecipes = [...savedRecipes, ...mockRecipes.filter(mock =>
          !savedRecipes.some((saved: Recipe) => saved.id === mock.id)
        )]

        setRecipes(allRecipes)
      } else {
        // TODO: Load from Supabase
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setRecipes(data || [])
      }
    } catch (error) {
      console.error('Error loading recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMealPlan = () => {
    // Load meal plan from localStorage
    try {
      const savedMealPlan = JSON.parse(localStorage.getItem('mealPlan') || '[]')
      setMealPlan(savedMealPlan)
    } catch (error) {
      console.error('Error loading meal plan from localStorage:', error)
      setMealPlan([])
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek)
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newDate)
  }

  const handleAddRecipe = (date: Date, mealType: string) => {
    setSelectedSlot({
      date: date.toISOString().split('T')[0],
      mealType
    })
    setShowRecipeModal(true)
  }

  const addRecipeToMealPlan = (recipe: Recipe) => {
    if (!selectedSlot) return

    const newMealPlanItem: MealPlanItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      recipe,
      date: selectedSlot.date,
      mealType: selectedSlot.mealType
    }

    const updatedMealPlan = [...mealPlan, newMealPlanItem]
    setMealPlan(updatedMealPlan)
    try {
      localStorage.setItem('mealPlan', JSON.stringify(updatedMealPlan))
    } catch (error) {
      console.error('Error saving meal plan to localStorage:', error)
    }

    setShowRecipeModal(false)
    setSelectedSlot(null)
  }

  const removeRecipeFromMealPlan = (mealPlanItemId: string) => {
    const updatedMealPlan = mealPlan.filter(item => item.id !== mealPlanItemId)
    setMealPlan(updatedMealPlan)
    try {
      localStorage.setItem('mealPlan', JSON.stringify(updatedMealPlan))
    } catch (error) {
      console.error('Error saving meal plan to localStorage:', error)
    }
  }

  const getMealPlanItems = (date: Date, mealType: string) => {
    const dateStr = date.toISOString().split('T')[0]
    return mealPlan.filter(item => item.date === dateStr && item.mealType === mealType)
  }

  const clearWeekMealPlan = () => {
    if (confirm('Are you sure you want to clear this week\'s meal plan?')) {
      const weekDates = days.map(day => day.toISOString().split('T')[0])
      const updatedMealPlan = mealPlan.filter(item => !weekDates.includes(item.date))
      setMealPlan(updatedMealPlan)
      try {
        localStorage.setItem('mealPlan', JSON.stringify(updatedMealPlan))
      } catch (error) {
        console.error('Error saving meal plan to localStorage:', error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-900">Recipe Planner</h1>
            </Link>
            <nav className="flex space-x-8">
              <Link href="/recipes" className="text-gray-600 hover:text-gray-900 font-medium">
                Recipes
              </Link>
              <Link href="/meal-plan" className="text-orange-600 font-medium">
                Meal Plan
              </Link>
              <Link href="/shopping-list" className="text-gray-600 hover:text-gray-900 font-medium">
                Shopping List
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Meal Plan</h2>
            <p className="text-gray-600 mt-2">Plan your weekly meals and generate shopping lists</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={clearWeekMealPlan}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Week</span>
            </button>
            <Link
              href="/shopping-list/generate"
              className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Generate Shopping List</span>
            </Link>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateWeek('prev')}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Previous Week</span>
            </button>

            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">
                Week of {formatDate(weekStart)}
              </h3>
              <p className="text-gray-600">
                {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {' '}
                {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            <button
              onClick={() => navigateWeek('next')}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span>Next Week</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Meal Plan Grid */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="grid grid-cols-8 gap-0">
            {/* Header Row */}
            <div className="bg-gray-50 p-4 border-b border-r">
              <span className="font-semibold text-gray-900">Meal</span>
            </div>
            {days.map((day, index) => (
              <div key={index} className="bg-gray-50 p-4 border-b border-r last:border-r-0">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{getDayName(day.getDay())}</div>
                  <div className="text-sm text-gray-600">{day.getDate()}</div>
                </div>
              </div>
            ))}

            {/* Meal Rows */}
            {mealTypes.map((mealType) => (
              <div key={mealType} className="contents">
                <div className="bg-gray-50 p-4 border-b border-r">
                  <span className="font-medium text-gray-900 capitalize">{mealType}</span>
                </div>
                {days.map((day, dayIndex) => {
                  const mealItems = getMealPlanItems(day, mealType)

                  return (
                    <div key={`${mealType}-${dayIndex}`} className="p-4 border-b border-r last:border-r-0 min-h-[120px]">
                      <div className="h-full flex flex-col space-y-2">
                        {/* Existing meal items */}
                        {mealItems.map((item) => (
                          <div key={item.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3 relative group">
                            <button
                              onClick={() => removeRecipeFromMealPlan(item.id)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-orange-200 rounded"
                            >
                              <X className="h-3 w-3 text-orange-600" />
                            </button>
                            <h4 className="font-medium text-gray-900 text-sm mb-1 pr-6">{item.recipe.title}</h4>
                            <div className="flex items-center text-xs text-gray-600 space-x-3">
                              {item.recipe.cooking_time && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatCookingTime(item.recipe.cooking_time)}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{item.recipe.servings}</span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Add recipe button */}
                        <div className="flex-1 flex items-center justify-center">
                          <button
                            onClick={() => handleAddRecipe(day, mealType)}
                            className="w-full h-full min-h-[60px] border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors flex items-center justify-center group"
                          >
                            <div className="text-center">
                              <Plus className="h-5 w-5 text-gray-400 group-hover:text-orange-600 mx-auto mb-1" />
                              <span className="text-xs text-gray-500 group-hover:text-orange-600">Add Recipe</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/recipes"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <ChefHat className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Browse Recipes</h3>
                <p className="text-gray-600">Find recipes to add to your meal plan</p>
              </div>
            </div>
          </Link>

          <Link
            href="/recipes/new"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Plus className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add New Recipe</h3>
                <p className="text-gray-600">Create a new recipe for your collection</p>
              </div>
            </div>
          </Link>

          <Link
            href="/shopping-list"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Shopping Lists</h3>
                <p className="text-gray-600">View and manage your shopping lists</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recipe Selection Modal */}
        {showRecipeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Select a Recipe for {selectedSlot?.mealType} on {selectedSlot?.date}
                </h3>
                <button
                  onClick={() => setShowRecipeModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading recipes...</p>
                  </div>
                ) : recipes.length === 0 ? (
                  <div className="text-center py-8">
                    <ChefHat className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No recipes found</h4>
                    <p className="text-gray-600 mb-4">Add some recipes first to plan your meals</p>
                    <Link
                      href="/recipes/new"
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Add Recipe
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recipes.map((recipe) => (
                      <button
                        key={recipe.id}
                        onClick={() => addRecipeToMealPlan(recipe)}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all text-left"
                      >
                        <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-3">
                          {recipe.image_url ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={recipe.image_url}
                                alt={recipe.title}
                                className="w-full h-full object-cover"
                              />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ChefHat className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">{recipe.title}</h4>
                        {recipe.description && (
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{recipe.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          {recipe.cooking_time && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatCookingTime(recipe.cooking_time)}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {recipe.meal_type.slice(0, 2).map((type) => (
                            <span
                              key={type}
                              className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
