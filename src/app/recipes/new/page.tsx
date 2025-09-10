'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChefHat, Plus, X, Save, ArrowLeft } from 'lucide-react'
import { createSupabaseClient, hasValidSupabaseConfig } from '@/lib/supabase'

interface Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
  notes?: string
}

export default function NewRecipePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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

  const handleInputChange = (field: string, value: string | number | string[]) => {
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
    const newId = (ingredients.length + 1).toString()
    setIngredients(prev => [...prev, { id: newId, name: '', quantity: 0, unit: '', notes: '' }])
  }

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id))
  }

  const updateIngredient = (id: string, field: keyof Ingredient, value: string | number) => {
    setIngredients(prev => prev.map(ing => 
      ing.id === id ? { ...ing, [field]: value } : ing
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create recipe object
      const recipe = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url,
        external_url: formData.external_url,
        cooking_time: formData.cooking_time ? parseInt(formData.cooking_time) : null,
        servings: formData.servings,
        meal_type: formData.meal_type,
        dietary_tags: formData.dietary_tags,
        ingredients: ingredients.filter(ing => ing.name.trim() !== ''),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (!hasValidSupabaseConfig()) {
        // Save to localStorage as fallback
        try {
          const existingRecipes = JSON.parse(localStorage.getItem('recipes') || '[]')
          existingRecipes.push(recipe)
          localStorage.setItem('recipes', JSON.stringify(existingRecipes))

          // Redirect without blocking alert
          router.push('/recipes')
          return
        } catch (storageError) {
          console.error('Error saving to localStorage:', storageError)
          throw new Error('Failed to save recipe to local storage')
        }
      }

      // TODO: Implement Supabase saving
      const { error } = await supabase
        .from('recipes')
        .insert([{
          title: recipe.title,
          description: recipe.description,
          image_url: recipe.image_url,
          external_url: recipe.external_url,
          cooking_time: recipe.cooking_time,
          servings: recipe.servings,
          meal_type: recipe.meal_type,
          dietary_tags: recipe.dietary_tags,
          user_id: 'demo-user' // In real app, get from auth
        }])
        .select()

      if (error) throw error

      // Redirect without blocking alert
      router.push('/recipes')
    } catch (error) {
      console.error('Error saving recipe:', error)
      alert('Error saving recipe. Please try again.')
    } finally {
      setLoading(false)
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
            <h2 className="text-3xl font-bold text-gray-900">Add New Recipe</h2>
            <p className="text-gray-600 mt-2">Create a new recipe for your collection</p>
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
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  placeholder="Describe your recipe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cooking Time (minutes)
                </label>
                <input
                  type="number"
                  min="1"
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
                  min="1"
                  required
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
              {mealTypes.map(type => (
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
              {dietaryTags.map(tag => (
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
                      min="0"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(ingredient.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
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
                      placeholder="cups, lbs, etc."
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
                      placeholder="diced, chopped"
                    />
                  </div>
                  <div className="col-span-1">
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(ingredient.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
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
              className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-5 w-5" />
              <span>{loading ? 'Saving...' : 'Save Recipe'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
