import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCookingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours} hr`
  }
  return `${hours} hr ${remainingMinutes} min`
}

export function getDayName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const idx = Math.max(0, Math.min(6, Math.floor(dayIndex)))
  return days[idx]
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function consolidateIngredients(recipeIngredients: Array<{
  ingredient: { name: string; category: string; unit?: string }
  quantity: number
  unit?: string
  servings: number
  originalServings: number
  recipeTitle?: string
}>): Array<{
  name: string
  category: string
  totalQuantity: number
  unit: string
  recipes: string[]
}> {
  type Entry = {
    name: string
    category: string
    totalQuantity: number
    unit: string
    recipes: string[]
  }

  const consolidated = new Map<string, Entry>()

  recipeIngredients.forEach(({ ingredient, quantity, unit, servings, originalServings, recipeTitle }) => {
    const adjustedQuantity = (quantity * servings) / originalServings
    const finalUnit = unit || ingredient.unit || 'unit'
    const key = `${ingredient.name.toLowerCase().trim()}-${finalUnit}`

    if (consolidated.has(key)) {
      const existing = consolidated.get(key) as Entry
      existing.totalQuantity += adjustedQuantity
      if (recipeTitle && !existing.recipes.includes(recipeTitle)) {
        existing.recipes.push(recipeTitle)
      }
    } else {
      consolidated.set(key, {
        name: ingredient.name,
        category: ingredient.category,
        totalQuantity: adjustedQuantity,
        unit: finalUnit,
        recipes: recipeTitle ? [recipeTitle] : []
      })
    }
  })

  return Array.from(consolidated.values()).sort((a, b) => a.category.localeCompare(b.category))
}
