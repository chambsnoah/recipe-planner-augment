'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChefHat, ShoppingCart, Plus, Check, X, GripVertical } from 'lucide-react'

interface ShoppingListItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  is_purchased: boolean
  store_section?: string
}

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingListItem[]>([])

  useEffect(() => {
    loadShoppingList()
  }, [])

  const loadShoppingList = () => {
    try {
      const savedItems = JSON.parse(localStorage.getItem('shoppingList') || '[]')
      setItems(savedItems)
    } catch (error) {
      console.error('Error loading shopping list:', error)
      setItems([])
    }
  }

  const saveShoppingList = (updatedItems: ShoppingListItem[]) => {
    try {
      localStorage.setItem('shoppingList', JSON.stringify(updatedItems))
      setItems(updatedItems)
    } catch (error) {
      console.error('Error saving shopping list:', error)
    }
  }

  const togglePurchased = (id: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, is_purchased: !item.is_purchased } : item
    )
    saveShoppingList(updatedItems)
  }

  const removeItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id)
    saveShoppingList(updatedItems)
  }

  // Group items by category
  const groupedItems = items.reduce((groups, item) => {
    const category = item.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(item)
    return groups
  }, {} as Record<string, ShoppingListItem[]>)

  const totalItems = items.length
  const purchasedItems = items.filter(item => item.is_purchased).length
  const progressPercentage = totalItems > 0 ? (purchasedItems / totalItems) * 100 : 0

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Shopping List</h2>
            <p className="text-gray-600 mt-2">Your consolidated shopping list from meal planning</p>
          </div>
          <Link
            href="/shopping-list/generate"
            className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Generate from Meal Plan</span>
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Shopping Progress</h3>
            <span className="text-sm text-gray-600">
              {purchasedItems} of {totalItems} items completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Shopping List */}
        {totalItems === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No items in your shopping list</h3>
            <p className="text-gray-600 mb-6">
              Generate a shopping list from your meal plan to get started.
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
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category} className="bg-white rounded-lg shadow-sm border">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                  <p className="text-sm text-gray-600">
                    {categoryItems.filter(item => !item.is_purchased).length} remaining
                  </p>
                </div>
                <div className="divide-y divide-gray-200">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center p-4 hover:bg-gray-50 transition-colors ${
                        item.is_purchased ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-center mr-4">
                        <GripVertical className="h-5 w-5 text-gray-400 mr-2 cursor-move" />
                        <button
                          onClick={() => togglePurchased(item.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            item.is_purchased
                              ? 'bg-green-600 border-green-600 text-white'
                              : 'border-gray-300 hover:border-green-500'
                          }`}
                        >
                          {item.is_purchased && <Check className="h-4 w-4" />}
                        </button>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className={`font-medium ${
                              item.is_purchased ? 'line-through text-gray-500' : 'text-gray-900'
                            }`}>
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {item.quantity} {item.unit}
                              {item.store_section && ` • ${item.store_section}`}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/meal-plan"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Plus className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Update Meal Plan</h3>
                <p className="text-gray-600">Add more recipes to generate additional items</p>
              </div>
            </div>
          </Link>

          <button
            onClick={() => {
              // Clear all purchased items
              const updatedItems = items.filter(item => !item.is_purchased)
              saveShoppingList(updatedItems)
            }}
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Clear Purchased</h3>
                <p className="text-gray-600">Remove all checked items from the list</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
