'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ChefHat, Clock, Users, ArrowLeft, Edit, ExternalLink, Trash2 } from 'lucide-react'
import { createSupabaseClient, hasValidSupabaseConfig } from '@/lib/supabase'
import { formatCookingTime } from '@/lib/utils'

interface Recipe {
  id: string
  title: string
  description: string | null
  image_url: string | null
  external_url: string | null
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

/**
 * Page component that displays detailed information for a single recipe.
 *
 * Fetches recipe data based on the route `id` parameter from Supabase when configured,
 * otherwise falls back to localStorage merged with built-in mock recipes. While loading
 * shows a full-screen loading indicator; if no recipe is found the user is redirected
 * back to the recipes list (or a "Recipe not found" view is shown briefly before redirect).
 *
 * The rendered UI includes the recipe image (or placeholder), title and description,
 * cooking time, servings, external link (when present), meal type and dietary tag pills,
 * and a detailed ingredients list. An Edit button links to the recipe edit route.
 *
 * Side effects:
 * - Reads `id` from route params.
 * - Navigates to /recipes on missing data or fetch errors.
 *
 * @returns The JSX element for the recipe detail page.
 */
export default function RecipeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const recipeId = params.id as string

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchRecipe()
  }, [recipeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRecipe = async () => {
    try {
      if (!hasValidSupabaseConfig()) {
        // Load from localStorage and mock data (resilient to corrupt data)
        let savedRecipes: Recipe[] = []
        try {
          savedRecipes = JSON.parse(localStorage.getItem('recipes') || '[]')
        } catch (err) {
          console.error('Error parsing saved recipes from localStorage:', err)
          savedRecipes = []
        }
        const mockRecipes = [
          {
            id: '1',
            title: 'Chicken Stir Fry',
            description: 'Quick and healthy chicken stir fry with vegetables',
            image_url: null,
            external_url: null,
            cooking_time: 25,
            servings: 4,
            meal_type: ['dinner'],
            dietary_tags: ['gluten-free'],
            ingredients: [
              { id: '1', name: 'Chicken breast', quantity: 1, unit: 'lb', notes: 'cut into strips' },
              { id: '2', name: 'Mixed vegetables', quantity: 2, unit: 'cups', notes: 'frozen or fresh' },
              { id: '3', name: 'Soy sauce', quantity: 3, unit: 'tbsp', notes: '' },
              { id: '4', name: 'Garlic', quantity: 2, unit: 'cloves', notes: 'minced' }
            ]
          },
          {
            id: '2',
            title: 'Overnight Oats',
            description: 'Easy breakfast prep with oats, milk, and fruits',
            image_url: null,
            external_url: null,
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
          }
        ]
        
        const allRecipes = [...savedRecipes, ...mockRecipes.filter(mock => 
          !savedRecipes.some((saved: Recipe) => saved.id === mock.id)
        )]
        
        const foundRecipe = allRecipes.find((r: Recipe) => r.id === recipeId)
        
        if (foundRecipe) {
          setRecipe(foundRecipe)
        } else {
          router.replace('/recipes')
        }
      } else {
        // Load from Supabase
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', recipeId)
          .single()

        if (error) throw error
        
        if (data) {
          // Load ingredients
          const { data: riData, error: riError } = await supabase
            .from('recipe_ingredients')
            .select(`
              quantity,
              unit,
              notes,
              ingredients (
                name
              )
            `)
            .eq('recipe_id', recipeId)

          if (riError) throw riError

          let ingredients: Array<{
            id: string
            name: string
            quantity: number
            unit: string
            notes?: string
          }> = []

          if (riData && riData.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ingredients = riData.map((ri: any) => ({
              id: Date.now().toString() + Math.random().toString(36).substring(2),
              name: ri.ingredients.name,
              quantity: ri.quantity,
              unit: ri.unit || '',
              notes: ri.notes || ''
            }))
          }

          setRecipe({
            ...data,
            ingredients
          } as Recipe)
        }
      }
    } catch (error) {
      console.error('Error fetching recipe:', error)
      router.replace('/recipes')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!recipe) return

    const confirmed = window.confirm(`Are you sure you want to delete "${recipe.title}"? This action cannot be undone.`)
    if (!confirmed) return

    setDeleting(true)
    try {
      if (!hasValidSupabaseConfig()) {
        // Delete from localStorage (resilient parsing)
        let existingRecipes: Recipe[] = []
        try {
          existingRecipes = JSON.parse(localStorage.getItem('recipes') || '[]')
        } catch (err) {
          console.error('Error parsing recipes from localStorage:', err)
          existingRecipes = []
        }

        const updatedRecipes = existingRecipes.filter((r: Recipe) => r.id !== recipeId)
        try {
          localStorage.setItem('recipes', JSON.stringify(updatedRecipes))
        } catch (err) {
          console.error('Error saving updated recipes to localStorage:', err)
        }

        // Also remove from meal plans if present
        let mealPlan: Array<{ recipe?: { id: string } }> = []
        try {
          mealPlan = JSON.parse(localStorage.getItem('mealPlan') || '[]')
        } catch (err) {
          console.error('Error parsing mealPlan from localStorage:', err)
          mealPlan = []
        }

        const updatedMealPlan = mealPlan.filter((item: { recipe?: { id: string } }) => item.recipe?.id !== recipeId)
        try {
          localStorage.setItem('mealPlan', JSON.stringify(updatedMealPlan))
        } catch (err) {
          console.error('Error saving updated mealPlan to localStorage:', err)
        }

        router.replace('/recipes')
        return
      }

      // TODO: Implement Supabase deletion
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)

      if (error) throw error

      router.replace('/recipes')
    } catch (error) {
      console.error('Error deleting recipe:', error)
      alert('Error deleting recipe. Please try again.')
    } finally {
      if (mountedRef.current) setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading recipe...</p>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Recipe not found</h2>
          <p className="text-gray-600 mb-6">The recipe you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/recipes"
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Back to Recipes
          </Link>
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
              <Link href="/recipes" className="text-orange-600 font-medium">
                Recipes
              </Link>
              <Link href="/meal-plan" className="text-gray-600 hover:text-gray-900 font-medium">
                Meal Plan
              </Link>
              <Link href="/shopping-list" className="text-gray-600 hover:text-gray-900 font-medium">
                Shopping List
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link
              href="/recipes"
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{recipe.title}</h2>
              {recipe.description && (
                <p className="text-gray-600 mt-2">{recipe.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href={`/recipes/${recipe.id}/edit`}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Recipe</span>
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              <span>{deleting ? 'Deleting...' : 'Delete'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recipe Image */}
          <div className="lg:col-span-1">
            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-6">
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
                  <ChefHat className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Recipe Info */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipe Info</h3>
              <div className="space-y-3">
                {recipe.cooking_time && (
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">{formatCookingTime(recipe.cooking_time)}</span>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400" />
<span className="text-gray-700">{recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
                </div>
                {recipe.external_url && (
                  <div className="flex items-center space-x-3">
                    <ExternalLink className="h-5 w-5 text-gray-400" />
                    <a
                      href={recipe.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:text-orange-700 underline"
                    >
                      View Original Recipe
                    </a>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Meal Types</h4>
                <div className="flex flex-wrap gap-2">
                  {recipe.meal_type.map((type) => (
                    <span
                      key={type}
                      className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full"
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                  ))}
                </div>
              </div>

              {recipe.dietary_tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Dietary Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {recipe.dietary_tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                      >
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ingredients */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingredients</h3>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                <div className="space-y-3">
                  {recipe.ingredients.map((ingredient) => (
                    <div key={ingredient.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{ingredient.name}</span>
                        {ingredient.notes && (
                          <span className="text-gray-600 text-sm ml-2">({ingredient.notes})</span>
                        )}
                      </div>
                      <div className="text-gray-700 font-medium">
                        {ingredient.quantity} {ingredient.unit}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No ingredients listed for this recipe.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
