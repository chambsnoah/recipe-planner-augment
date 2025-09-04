'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { ChefHat, Plus, X, Save, ArrowLeft } from 'lucide-react'
import { createSupabaseClient, hasValidSupabaseConfig } from '@/lib/supabase'

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
  description: string
  image_url: string
  external_url: string
  cooking_time: number | null
  servings: number
  meal_type: string[]
  dietary_tags: string[]
  ingredients?: Ingredient[]
}

export default function EditRecipePage() {
  const router = useRouter()
  const params = useParams()
  const recipeId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [loadingRecipe, setLoadingRecipe] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    external_url: '',
    cooking_time: '',
    servings: 4,
    meal_type: [] as string[],
    dietary_tags: [] as string[]
  })
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: '', quantity: 0, unit: '', notes: '' }
  ])

  const supabase = createSupabaseClient()

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert']
  const dietaryTags = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'low-fodmap', 'keto', 'paleo']

  useEffect(() => {
    fetchRecipe()
  }, [recipeId])

  const fetchRecipe = async () => {
    try {
      if (!hasValidSupabaseConfig()) {
        // Load from localStorage and mock data
        const savedRecipes = JSON.parse(localStorage.getItem('recipes') || '[]')
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

        // Combine saved recipes with mock data, avoiding duplicates
        const allRecipes = [...savedRecipes, ...mockRecipes.filter(mock =>
          !savedRecipes.some((saved: Recipe) => saved.id === mock.id)
        )]

        const recipe = allRecipes.find((r: Recipe) => r.id === recipeId)

        if (recipe) {
          setFormData({
            title: recipe.title,
            description: recipe.description || '',
            image_url: recipe.image_url || '',
            external_url: recipe.external_url || '',
            cooking_time: recipe.cooking_time?.toString() || '',
            servings: recipe.servings,
            meal_type: recipe.meal_type,
            dietary_tags: recipe.dietary_tags
          })

          if (recipe.ingredients && recipe.ingredients.length > 0) {
            setIngredients(recipe.ingredients)
          }
        } else {
          alert('Recipe not found')
          router.push('/recipes')
        }
      } else {
        // TODO: Load from Supabase
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', recipeId)
          .single()

        if (error) throw error
        
        if (data) {
          setFormData({
            title: data.title,
            description: data.description || '',
            image_url: data.image_url || '',
            external_url: data.external_url || '',
            cooking_time: data.cooking_time?.toString() || '',
            servings: data.servings,
            meal_type: data.meal_type,
            dietary_tags: data.dietary_tags
          })
        }
      }
    } catch (error) {
      console.error('Error fetching recipe:', error)
      alert('Error loading recipe')
      router.push('/recipes')
    } finally {
      setLoadingRecipe(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayToggle = (field: 'meal_type' | 'dietary_tags', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }

  const addIngredient = () => {
    const newId = Date.now().toString() + Math.random().toString(36).substring(2, 11)
    setIngredients(prev => [...prev, { id: newId, name: '', quantity: 0, unit: '', notes: '' }])
  }

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id))
  }

  const updateIngredient = (id: string, field: keyof Ingredient, value: any) => {
    setIngredients(prev => prev.map(ing => 
      ing.id === id ? { ...ing, [field]: value } : ing
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create updated recipe object
      const updatedRecipe = {
        id: recipeId,
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url,
        external_url: formData.external_url,
        cooking_time: formData.cooking_time ? parseInt(formData.cooking_time) : null,
        servings: formData.servings,
        meal_type: formData.meal_type,
        dietary_tags: formData.dietary_tags,
        ingredients: ingredients.filter(ing => ing.name.trim() !== ''),
        updated_at: new Date().toISOString()
      }

      if (!hasValidSupabaseConfig()) {
        // Update in localStorage
        const existingRecipes = JSON.parse(localStorage.getItem('recipes') || '[]')
        const updatedRecipes = existingRecipes.map((recipe: Recipe) => 
          recipe.id === recipeId ? { ...recipe, ...updatedRecipe } : recipe
        )
        localStorage.setItem('recipes', JSON.stringify(updatedRecipes))

        // Redirect without blocking alert
        router.push('/recipes')
        return
      }

      // TODO: Implement Supabase updating
      const { error } = await supabase
        .from('recipes')
        .update({
          title: updatedRecipe.title,
          description: updatedRecipe.description,
          image_url: updatedRecipe.image_url,
          external_url: updatedRecipe.external_url,
          cooking_time: updatedRecipe.cooking_time,
          servings: updatedRecipe.servings,
          meal_type: updatedRecipe.meal_type,
          dietary_tags: updatedRecipe.dietary_tags,
          updated_at: updatedRecipe.updated_at
        })
        .eq('id', recipeId)

      if (error) throw error

      // Redirect without blocking alert
      router.push('/recipes')
    } catch (error) {
      console.error('Error updating recipe:', error)
      alert('Error updating recipe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingRecipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading recipe...</p>
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
        <div className="flex items-center mb-8">
          <Link
            href="/recipes"
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Edit Recipe</h2>
            <p className="text-gray-600 mt-2">Update your recipe details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  placeholder="Enter recipe title"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  placeholder="Describe your recipe..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cooking Time (minutes)
                </label>
                <input
                  type="number"
                  value={formData.cooking_time}
                  onChange={(e) => handleInputChange('cooking_time', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  placeholder="30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servings *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.servings}
                  onChange={(e) => handleInputChange('servings', parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  External Recipe URL
                </label>
                <input
                  type="url"
                  value={formData.external_url}
                  onChange={(e) => handleInputChange('external_url', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  placeholder="https://example.com/recipe"
                />
              </div>
            </div>
          </div>

          {/* Meal Types */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Meal Types</h3>
            <div className="flex flex-wrap gap-3">
              {mealTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleArrayToggle('meal_type', type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    formData.meal_type.includes(type)
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Tags */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dietary Tags</h3>
            <div className="flex flex-wrap gap-3">
              {dietaryTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleArrayToggle('dietary_tags', tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    formData.dietary_tags.includes(tag)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ingredients</h3>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Ingredient</span>
              </button>
            </div>

            <div className="space-y-4">
              {ingredients.map((ingredient) => (
                <div key={ingredient.id} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ingredient Name
                    </label>
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                      placeholder="e.g., Chicken breast"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(ingredient.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                      placeholder="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(ingredient.id, 'unit', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                      placeholder="lbs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={ingredient.notes || ''}
                      onChange={(e) => updateIngredient(ingredient.id, 'notes', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                      placeholder="optional"
                    />
                  </div>
                  <div className="col-span-1">
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(ingredient.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/recipes"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>{loading ? 'Updating...' : 'Update Recipe'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
