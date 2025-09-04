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
  return days[dayIndex]
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
}>): Array<{
  name: string
  category: string
  totalQuantity: number
  unit: string
  recipes: string[]
}> {
  const consolidated = new Map()

  recipeIngredients.forEach(({ ingredient, quantity, unit, servings, originalServings }) => {
    const adjustedQuantity = (quantity * servings) / originalServings
    const finalUnit = unit || ingredient.unit || 'unit'
    const key = `${ingredient.name}-${finalUnit}`

    if (consolidated.has(key)) {
      const existing = consolidated.get(key)
      existing.totalQuantity += adjustedQuantity
    } else {
      consolidated.set(key, {
        name: ingredient.name,
        category: ingredient.category,
        totalQuantity: adjustedQuantity,
        unit: finalUnit,
        recipes: []
      })
    }
  })

  return Array.from(consolidated.values()).sort((a, b) => a.category.localeCompare(b.category))
}
