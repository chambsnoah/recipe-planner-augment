import Link from "next/link";
import { ChefHat, Calendar, ShoppingCart, Search } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-900">Recipe Planner</h1>
            </div>
            <nav className="flex space-x-8">
              <Link href="/recipes" className="text-gray-600 hover:text-gray-900 font-medium">
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

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Make Meal Planning
            <span className="text-orange-600"> Effortless</span>
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your weekly meal planning from a tedious spreadsheet task into an intuitive,
            streamlined experience. Organize recipes, plan meals, and generate smart shopping lists automatically.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/recipes"
              className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              Browse Recipes
            </Link>
            <Link
              href="/meal-plan"
              className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold border-2 border-orange-600 hover:bg-orange-50 transition-colors"
            >
              Start Planning
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
              <Search className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Recipe Search</h3>
            <p className="text-gray-600">
              Filter recipes by dietary restrictions, cooking time, meal type, and ingredients.
              Find exactly what you need in seconds.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Weekly Meal Planning</h3>
            <p className="text-gray-600">
              Drag and drop recipes into your weekly calendar. Adjust serving sizes and
              see your meal plan at a glance.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
              <ShoppingCart className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Auto Shopping Lists</h3>
            <p className="text-gray-600">
              Generate consolidated shopping lists from your meal plan. Organize by store
              and ingredient type for efficient shopping.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
