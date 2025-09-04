'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChefHat, Plus, Search, Clock, Users, Edit, Trash2 } from 'lucide-react'
import { createSupabaseClient, hasValidSupabaseConfig } from '@/lib/supabase'
import { formatCookingTime } from '@/lib/utils'

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

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([])
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<string[]>([])

  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchRecipes()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRecipes = async () => {
    try {
      if (!hasValidSupabaseConfig()) {
        // Load from localStorage and combine with mock data
        let savedRecipes = []
        try {
          savedRecipes = JSON.parse(localStorage.getItem('recipes') || '[]')
        } catch (error) {
          console.error('Error loading from localStorage:', error)
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
              { id: '3', name: 'Soy sauce', quantity: 3, unit: 'tbsp', notes: '' },
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
              { id: '1', name: 'Bread slices', quantity: 2, unit: 'pieces', notes: 'whole grain preferred' },
              { id: '2', name: 'Avocado', quantity: 1, unit: 'large', notes: 'ripe' },
              { id: '3', name: 'Lemon juice', quantity: 1, unit: 'tsp', notes: '' },
              { id: '4', name: 'Salt', quantity: 0.25, unit: 'tsp', notes: 'to taste' },
              { id: '5', name: 'Cherry tomatoes', quantity: 4, unit: 'pieces', notes: 'optional' }
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
              { id: '2', name: 'Tomatoes', quantity: 3, unit: 'medium', notes: 'chopped' },
              { id: '3', name: 'Red onion', quantity: 0.5, unit: 'medium', notes: 'thinly sliced' },
              { id: '4', name: 'Feta cheese', quantity: 4, unit: 'oz', notes: 'crumbled' },
              { id: '5', name: 'Olive oil', quantity: 3, unit: 'tbsp', notes: 'extra virgin' },
              { id: '6', name: 'Olives', quantity: 0.5, unit: 'cup', notes: 'kalamata' }
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

        // Combine saved recipes with mock data, avoiding duplicates
        const allRecipes = [...savedRecipes, ...mockRecipes.filter(mock =>
          !savedRecipes.some((saved: Recipe) => saved.id === mock.id)
        )]

        setRecipes(allRecipes)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching recipes:', error)
      } else {
        setRecipes(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (recipeId: string, recipeTitle: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${recipeTitle}"? This action cannot be undone.`)
    if (!confirmed) return

    try {
      if (!hasValidSupabaseConfig()) {
        // Delete from localStorage
        const existingRecipes = JSON.parse(localStorage.getItem('recipes') || '[]')
        const updatedRecipes = existingRecipes.filter((r: Recipe) => r.id !== recipeId)
        localStorage.setItem('recipes', JSON.stringify(updatedRecipes))

        // Also remove from meal plans if present
        const mealPlan = JSON.parse(localStorage.getItem('mealPlan') || '[]')
        const updatedMealPlan = mealPlan.filter((item: { recipe?: { id: string } }) => item.recipe?.id !== recipeId)
        localStorage.setItem('mealPlan', JSON.stringify(updatedMealPlan))

        // Refresh the recipes list
        fetchRecipes()
        return
      }

      // TODO: Implement Supabase deletion
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)

      if (error) throw error

      // Refresh the recipes list
      fetchRecipes()
    } catch (error) {
      console.error('Error deleting recipe:', error)
      alert('Error deleting recipe. Please try again.')
    }
  }

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (recipe.description && recipe.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesMealType = selectedMealTypes.length === 0 || 
                           selectedMealTypes.some(type => recipe.meal_type.includes(type))
    
    const matchesDietary = selectedDietaryTags.length === 0 || 
                          selectedDietaryTags.some(tag => recipe.dietary_tags.includes(tag))

    return matchesSearch && matchesMealType && matchesDietary
  })

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert']
  const dietaryTags = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'low-fodmap', 'keto', 'paleo']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-orange-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading recipes...</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Recipes</h2>
            <p className="text-gray-600 mt-2">Organize and manage your recipe collection</p>
          </div>
          <Link
            href="/recipes/new"
            className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Recipe</span>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                />
              </div>
            </div>

            {/* Meal Type Filter */}
            <div className="lg:w-64">
              <select
                multiple
                value={selectedMealTypes}
                onChange={(e) => setSelectedMealTypes(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="" disabled>Meal Types</option>
                {mealTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Dietary Filter */}
            <div className="lg:w-64">
              <select
                multiple
                value={selectedDietaryTags}
                onChange={(e) => setSelectedDietaryTags(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="" disabled>Dietary Tags</option>
                {dietaryTags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Recipes Grid */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No recipes found</h3>
            <p className="text-gray-600 mb-6">
              {recipes.length === 0 
                ? "Get started by adding your first recipe!"
                : "Try adjusting your search or filters."
              }
            </p>
            <Link
              href="/recipes/new"
              className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Your First Recipe</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow relative"
              >
                {/* Action Buttons */}
                <div className="absolute top-3 right-3 z-10 flex space-x-2">
                  <Link
                    href={`/recipes/${recipe.id}/edit`}
                    className="p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit className="h-4 w-4 text-gray-600 hover:text-orange-600" />
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(recipe.id, recipe.title)
                    }}
                    className="p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-gray-600 hover:text-red-600" />
                  </button>
                </div>

                <Link href={`/recipes/${recipe.id}`} className="block">
                  <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
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
                        <ChefHat className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{recipe.title}</h3>
                    {recipe.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      {recipe.cooking_time && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatCookingTime(recipe.cooking_time)}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {recipe.meal_type.slice(0, 2).map((type) => (
                        <span
                          key={type}
                          className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                        >
                          {type}
                        </span>
                      ))}
                      {recipe.dietary_tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
