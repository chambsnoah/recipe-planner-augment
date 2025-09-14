'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChefHat, ShoppingCart, ArrowLeft, Check, Calendar, Plus } from 'lucide-react'
// import { createSupabaseClient, hasValidSupabaseConfig } from '@/lib/supabase'

interface Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
  notes?: string
}

interface Recipe {
  id: string
  title: string
  description: string | null
  image_url: string | null
  cooking_time: number | null
  servings: number
  meal_type: string[]
  dietary_tags: string[]
  ingredients?: Ingredient[]
}

interface MealPlanItem {
  id: string
  recipe: Recipe
  date: string
  mealType: string
}

interface ShoppingListItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  is_purchased: boolean
  store_section?: string
  recipes: string[] // Track which recipes this ingredient comes from
}

export default function GenerateShoppingListPage() {
  const router = useRouter()
  const [mealPlan, setMealPlan] = useState<MealPlanItem[]>([])
  const [generatedItems, setGeneratedItems] = useState<ShoppingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  // const supabase = createSupabaseClient()

  useEffect(() => {
    loadMealPlan()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getMockRecipeIngredients = (recipeId: string) => {
    const mockRecipes: Record<string, Array<{id: string; name: string; quantity: number; unit: string; notes: string}>> = {
      '1': [
        { id: '1', name: 'Chicken breast', quantity: 1, unit: 'lb', notes: 'cut into strips' },
        { id: '2', name: 'Mixed vegetables', quantity: 2, unit: 'cups', notes: 'frozen or fresh' },
        { id: '3', name: 'Soy sauce', quantity: 3, unit: 'tbsp', notes: '' },
        { id: '4', name: 'Garlic', quantity: 2, unit: 'cloves', notes: 'minced' }
      ],
      '2': [
        { id: '1', name: 'Rolled oats', quantity: 0.5, unit: 'cup', notes: '' },
        { id: '2', name: 'Milk', quantity: 0.5, unit: 'cup', notes: 'any type' },
        { id: '3', name: 'Chia seeds', quantity: 1, unit: 'tbsp', notes: '' },
        { id: '4', name: 'Honey', quantity: 1, unit: 'tsp', notes: 'or maple syrup' },
        { id: '5', name: 'Berries', quantity: 0.25, unit: 'cup', notes: 'fresh or frozen' }
      ],
      '3': [
        { id: '1', name: 'Bread slices', quantity: 2, unit: 'pieces', notes: 'whole grain preferred' },
        { id: '2', name: 'Avocado', quantity: 1, unit: 'large', notes: 'ripe' },
        { id: '3', name: 'Lemon juice', quantity: 1, unit: 'tsp', notes: '' },
        { id: '4', name: 'Salt', quantity: 0.25, unit: 'tsp', notes: 'to taste' },
        { id: '5', name: 'Cherry tomatoes', quantity: 4, unit: 'pieces', notes: 'optional' }
      ],
      '4': [
        { id: '1', name: 'Cucumber', quantity: 1, unit: 'large', notes: 'diced' },
        { id: '2', name: 'Tomatoes', quantity: 3, unit: 'medium', notes: 'chopped' },
        { id: '3', name: 'Red onion', quantity: 0.5, unit: 'medium', notes: 'thinly sliced' },
        { id: '4', name: 'Feta cheese', quantity: 4, unit: 'oz', notes: 'crumbled' },
        { id: '5', name: 'Olive oil', quantity: 3, unit: 'tbsp', notes: 'extra virgin' },
        { id: '6', name: 'Olives', quantity: 0.5, unit: 'cup', notes: 'kalamata' }
      ],
      '5': [
        { id: '1', name: 'All-purpose flour', quantity: 2.25, unit: 'cups', notes: '' },
        { id: '2', name: 'Butter', quantity: 1, unit: 'cup', notes: 'softened' },
        { id: '3', name: 'Brown sugar', quantity: 0.75, unit: 'cup', notes: 'packed' },
        { id: '4', name: 'White sugar', quantity: 0.75, unit: 'cup', notes: '' },
        { id: '5', name: 'Eggs', quantity: 2, unit: 'large', notes: '' },
        { id: '6', name: 'Chocolate chips', quantity: 2, unit: 'cups', notes: 'semi-sweet' }
      ]
    }
    return mockRecipes[recipeId] || []
  }

  const loadMealPlan = () => {
    if (typeof window === 'undefined') return

    try {
      const savedMealPlan = JSON.parse(localStorage.getItem('mealPlan') || '[]')

      // Auto-migrate meal plan data: add ingredients to recipes that don't have them
      const migratedMealPlan = savedMealPlan.map((item: MealPlanItem) => {
        if (item.recipe && !item.recipe.ingredients) {
          // This recipe doesn't have ingredients, try to add them
          const ingredients = getMockRecipeIngredients(item.recipe.id)
          if (ingredients.length > 0) {
            return {
              ...item,
              recipe: {
                ...item.recipe,
                ingredients
              }
            }
          }
        }
        return item
      })

      // Save the migrated data back to localStorage
      if (JSON.stringify(migratedMealPlan) !== JSON.stringify(savedMealPlan)) {
        localStorage.setItem('mealPlan', JSON.stringify(migratedMealPlan))
      }

      setMealPlan(migratedMealPlan)

      if (migratedMealPlan.length > 0) {
        generateShoppingList(migratedMealPlan)
      }
    } catch (error) {
      console.error('Error loading meal plan:', error)
      setMealPlan([])
    } finally {
      setLoading(false)
    }
  }

  const categorizeIngredient = (ingredientName: string): string => {
    const name = ingredientName.toLowerCase()
    
    // Protein
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || 
        name.includes('fish') || name.includes('salmon') || name.includes('turkey') ||
        name.includes('eggs') || name.includes('tofu')) {
      return 'Protein'
    }
    
    // Dairy
    if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || 
        name.includes('butter') || name.includes('cream')) {
      return 'Dairy'
    }
    
    // Vegetables
    if (name.includes('carrot') || name.includes('onion') || name.includes('garlic') ||
        name.includes('tomato') || name.includes('pepper') || name.includes('lettuce') ||
        name.includes('spinach') || name.includes('broccoli') || name.includes('vegetable')) {
      return 'Vegetables'
    }
    
    // Fruits
    if (name.includes('apple') || name.includes('banana') || name.includes('berries') ||
        name.includes('orange') || name.includes('lemon') || name.includes('fruit')) {
      return 'Fruits'
    }
    
    // Grains
    if (name.includes('rice') || name.includes('pasta') || name.includes('bread') ||
        name.includes('flour') || name.includes('oats') || name.includes('quinoa')) {
      return 'Grains'
    }
    
    // Pantry
    if (name.includes('oil') || name.includes('sauce') || name.includes('spice') ||
        name.includes('salt') || name.includes('pepper') || name.includes('sugar') ||
        name.includes('honey') || name.includes('vinegar')) {
      return 'Pantry'
    }
    
    return 'Other'
  }

  const generateShoppingList = (mealPlanItems: MealPlanItem[]) => {
    setGenerating(true)
    
    const ingredientMap = new Map<string, ShoppingListItem>()
    
    mealPlanItems.forEach(mealItem => {
      if (mealItem.recipe.ingredients) {
        mealItem.recipe.ingredients.forEach(ingredient => {
          const key = `${ingredient.name.toLowerCase()}-${ingredient.unit.toLowerCase()}`
          
          if (ingredientMap.has(key)) {
            // Combine quantities for the same ingredient
            const existing = ingredientMap.get(key)!
            existing.quantity += ingredient.quantity
            existing.recipes.push(mealItem.recipe.title)
          } else {
            // Create new shopping list item
            const category = categorizeIngredient(ingredient.name)
            ingredientMap.set(key, {
              id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
              name: ingredient.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              category,
              is_purchased: false,
              recipes: [mealItem.recipe.title]
            })
          }
        })
      }
    })
    
    const items = Array.from(ingredientMap.values())
    setGeneratedItems(items)
    setGenerating(false)
  }

  const saveShoppingList = () => {
    if (typeof window === 'undefined') return

    try {
      // Load existing shopping list and merge with generated items
      const existingItems = JSON.parse(localStorage.getItem('shoppingList') || '[]')
      
      // Combine items, avoiding duplicates
      const combinedItems = [...existingItems]
      
      generatedItems.forEach(newItem => {
        const existingIndex = combinedItems.findIndex(existing => 
          existing.name.toLowerCase() === newItem.name.toLowerCase() && 
          existing.unit.toLowerCase() === newItem.unit.toLowerCase()
        )
        
        if (existingIndex >= 0) {
          // Update quantity if item already exists
          combinedItems[existingIndex].quantity += newItem.quantity
          combinedItems[existingIndex].recipes = [
            ...new Set([...combinedItems[existingIndex].recipes, ...newItem.recipes])
          ]
        } else {
          // Add new item
          combinedItems.push(newItem)
        }
      })
      
      localStorage.setItem('shoppingList', JSON.stringify(combinedItems))
      router.push('/shopping-list')
    } catch (error) {
      console.error('Error saving shopping list:', error)
      alert('Error saving shopping list. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meal plan...</p>
        </div>
      </div>
    )
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
              <Link href="/meal-plan" className="text-gray-600 hover:text-gray-900 font-medium">
                Meal Plan
              </Link>
              <Link href="/shopping-list" className="text-orange-600 font-medium">
                Shopping List
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center mb-8">
          <Link
            href="/meal-plan"
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Generate Shopping List</h2>
            <p className="text-gray-600 mt-2">Create a shopping list from your meal plan</p>
          </div>
        </div>

        {mealPlan.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No meals planned</h3>
            <p className="text-gray-600 mb-6">
              Add some recipes to your meal plan first to generate a shopping list.
            </p>
            <Link
              href="/meal-plan"
              className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Plan Your Meals</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Meal Plan Summary */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Planned Meals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mealPlan.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900">{item.recipe.title}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(item.date).toLocaleDateString()} • {item.mealType}
                    </p>
                    {item.recipe.servings && (
                      <p className="text-sm text-gray-500">Serves {item.recipe.servings}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Shopping List */}
            {generating ? (
              <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating shopping list...</p>
              </div>
            ) : generatedItems.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Generated Shopping List ({generatedItems.length} items)
                    </h3>
                    <button
                      onClick={saveShoppingList}
                      className="bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center space-x-2"
                    >
                      <Check className="h-4 w-4" />
                      <span>Save to Shopping List</span>
                    </button>
                  </div>
                </div>
                
                {/* Group items by category */}
                {Object.entries(
                  generatedItems.reduce((groups, item) => {
                    const category = item.category
                    if (!groups[category]) groups[category] = []
                    groups[category].push(item)
                    return groups
                  }, {} as Record<string, ShoppingListItem[]>)
                ).map(([category, categoryItems]) => (
                  <div key={category}>
                    <div className="bg-gray-50 px-6 py-3 border-b">
                      <h4 className="font-medium text-gray-900">{category}</h4>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {categoryItems.map((item) => (
                        <div key={item.id} className="p-4 flex justify-between items-center">
                          <div>
                            <h5 className="font-medium text-gray-900">{item.name}</h5>
                            <p className="text-sm text-gray-600">
                              {item.quantity} {item.unit}
                            </p>
                            <p className="text-xs text-gray-500">
                              From: {item.recipes.join(', ')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No ingredients found</h3>
                <p className="text-gray-600">
                  The recipes in your meal plan don&apos;t have ingredient lists yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
