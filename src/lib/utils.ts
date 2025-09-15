import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a duration given in minutes into a compact, human-readable string.
 *
 * If `minutes` is less than 60 the result is returned as "`X min`".
 * For 60 or more minutes the result is "`H hr`" when there is no remainder,
 * or "`H hr M min`" when there are remaining minutes. Hours are computed with
 * `Math.floor(minutes / 60)` and remaining minutes are `minutes % 60`.
 *
 * @param minutes - Duration in minutes (may be fractional); hours are floored and the remainder is shown as minutes.
 * @returns A compact string like `"45 min"`, `"2 hr"`, or `"1 hr 30 min"`.
 */
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

/**
 * Returns the weekday name for a numeric day index.
 *
 * The input is floored to an integer and clamped to the 0–6 range (0 = Sunday, 6 = Saturday),
 * so non-integer or out-of-range values are handled deterministically.
 *
 * @param dayIndex - Day index where 0 = Sunday. Non-integer values are floored; values <0 become 0 and >6 become 6.
 * @returns The corresponding weekday name ("Sunday" through "Saturday").
 */
export function getDayName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const idx = Math.max(0, Math.min(6, Math.floor(dayIndex)))
  return days[idx]
}

/**
 * Returns the Sunday that starts the week containing the given date, using UTC-based calendar calculations.
 *
 * The function does not mutate the input; it creates and returns a new Date whose UTC calendar day is set to that week's Sunday.
 * The time-of-day (hours/minutes/seconds/milliseconds) is preserved from the input date. Note: the computation uses UTC methods
 * (getUTCDay/getUTCDate/setUTCDate), so the result corresponds to the week's start in UTC terms rather than local time.
 *
 * @param date - Reference date used to determine the week
 * @returns A new Date set to the Sunday of `date`'s week (calculated using UTC)
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = d.getUTCDate() - day
  return new Date(d.setUTCDate(diff))
}

/**
 * Formats a Date as an ISO date string (YYYY-MM-DD).
 *
 * The returned string represents the UTC date portion of `date` (derived from `date.toISOString()`),
 * not the local-date representation. The input `date` is not mutated.
 *
 * @param date - The Date to format
 * @returns The date in `YYYY-MM-DD` format
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Consolidates a list of recipe ingredient entries into aggregated totals per ingredient+unit.
 *
 * Processes each input item by scaling its `quantity` from `originalServings` to `servings`, normalizes the unit
 * (preference: explicit `unit` argument → ingredient.unit → `'unit'`), and groups entries by case-insensitive
 * ingredient name + final unit. For each group it sums the adjusted quantities and collects unique `recipeTitle`s.
 *
 * @param recipeIngredients - Array of ingredient entries. Each item must include:
 *   - ingredient: { name, category, unit? }
 *   - quantity: number (amount for originalServings)
 *   - unit?: string (overrides ingredient.unit if provided)
 *   - servings: number (target servings to scale to)
 *   - originalServings: number (servings the `quantity` applies to)
 *   - recipeTitle?: string (optional; collected per consolidated entry if provided)
 * @returns Array of consolidated entries sorted by category. Each entry contains:
 *   - name: original ingredient name
 *   - category: ingredient category
 *   - totalQuantity: summed, scaled quantity for that name+unit
 *   - unit: resolved unit string
 *   - recipes: unique list of recipe titles that contributed to this entry (empty if none)
 */
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
