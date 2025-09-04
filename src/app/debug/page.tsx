'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'

export default function DebugPage() {
  const [mealPlan, setMealPlan] = useState<any[]>([])
  const [recipes, setRecipes] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    try {
      const mealPlanData = JSON.parse(localStorage.getItem('mealPlan') || '[]')
      const recipesData = JSON.parse(localStorage.getItem('recipes') || '[]')
      setMealPlan(mealPlanData)
      setRecipes(recipesData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const clearMealPlan = () => {
    if (confirm('Are you sure you want to clear your meal plan? This will remove all planned meals.')) {
      localStorage.removeItem('mealPlan')
      setMealPlan([])
      alert('Meal plan cleared! You can now re-add recipes with ingredients.')
    }
  }

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear ALL data? This will remove recipes, meal plans, and shopping lists.')) {
      localStorage.removeItem('mealPlan')
      localStorage.removeItem('recipes')
      localStorage.removeItem('shoppingList')
      setMealPlan([])
      setRecipes([])
      alert('All data cleared!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Debug Data</h1>
          <p className="text-gray-600 mt-2">
            Debug localStorage data to fix shopping list generation
          </p>
        </div>

        {/* Actions */}
        <div className="mb-8 flex space-x-4">
          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Data</span>
          </button>
          <button
            onClick={clearMealPlan}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            <span>Clear Meal Plan Only</span>
          </button>
          <button
            onClick={clearAllData}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <span>Clear All Data</span>
          </button>
        </div>

        {/* Meal Plan Data */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Meal Plan Data ({mealPlan.length} items)
          </h2>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {mealPlan.length === 0 ? (
              <p className="text-gray-500">No meal plan data</p>
            ) : (
              <div className="space-y-4">
                {mealPlan.map((item, index) => (
                  <div key={index} className="border-l-4 border-orange-500 pl-4">
                    <h3 className="font-medium text-gray-900">{item.recipe?.title || 'Unknown Recipe'}</h3>
                    <p className="text-sm text-gray-600">
                      {item.date} • {item.mealType}
                    </p>
                    <p className="text-sm text-gray-500">
                      Has ingredients: {item.recipe?.ingredients ? 'Yes' : 'No'}
                      {item.recipe?.ingredients && ` (${item.recipe.ingredients.length} items)`}
                    </p>
                    {item.recipe?.ingredients && (
                      <details className="mt-2">
                        <summary className="text-sm text-blue-600 cursor-pointer">Show ingredients</summary>
                        <ul className="mt-2 text-sm text-gray-600 ml-4">
                          {item.recipe.ingredients.map((ing: any, i: number) => (
                            <li key={i}>
                              {ing.quantity} {ing.unit} {ing.name}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recipes Data */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Saved Recipes ({recipes.length} items)
          </h2>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {recipes.length === 0 ? (
              <p className="text-gray-500">No saved recipes</p>
            ) : (
              <div className="space-y-4">
                {recipes.map((recipe, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-medium text-gray-900">{recipe.title}</h3>
                    <p className="text-sm text-gray-500">
                      Has ingredients: {recipe.ingredients ? 'Yes' : 'No'}
                      {recipe.ingredients && ` (${recipe.ingredients.length} items)`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            How to Fix Shopping List Generation
          </h3>
          <div className="text-blue-800 space-y-2">
            <p><strong>Problem:</strong> Your meal plan contains recipes without ingredient data.</p>
            <p><strong>Solution:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Click "Clear Meal Plan Only" to remove old meal plan data</li>
              <li>Go to the Meal Plan page and re-add your recipes</li>
              <li>The recipes now have ingredient data and will generate shopping lists</li>
            </ol>
            <p className="mt-4">
              <strong>Note:</strong> This won't delete your recipes, only the meal plan assignments.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
