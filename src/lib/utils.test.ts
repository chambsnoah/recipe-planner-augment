/**
 * Tests for utils functions using Jest
 */
import * as utils from "./utils"

// Small helper for near-equality on floats
const closeTo = (received: number, expected: number, precision = 6) => {
  const pow = Math.pow(10, precision)
  return Math.round(received * pow) === Math.round(expected * pow)
}

describe("cn", () => {
  it("merges class names, ignoring falsy values", () => {
    const res = utils.cn("p-2", null as any, undefined as any, false as any, "text-sm", "", 0 as any, "p-2", "hover:underline")
    expect(res).toContain("p-2")
    expect(res).toContain("text-sm")
    expect(res).toContain("hover:underline")
  })

  it("handles no inputs", () => {
    const res = utils.cn()
    expect(res).toBe("")
  })

  it("handles arrays and nested values via clsx-like semantics", () => {
    const res = utils.cn(["p-2", ["text-sm", false && "hidden"], null], "mb-2", ["p-2"])
    expect(res).toContain("p-2")
    expect(res).toContain("text-sm")
    expect(res).toContain("mb-2")
  })
})

describe("formatCookingTime", () => {
  it("returns minutes only when less than 60", () => {
    expect(utils.formatCookingTime(0)).toBe("0 min")
    expect(utils.formatCookingTime(1)).toBe("1 min")
    expect(utils.formatCookingTime(59)).toBe("59 min")
  })

  it("returns hours only for exact multiples of 60", () => {
    expect(utils.formatCookingTime(60)).toBe("1 hr")
    expect(utils.formatCookingTime(120)).toBe("2 hr")
  })

  it("returns hours and minutes otherwise", () => {
    expect(utils.formatCookingTime(61)).toBe("1 hr 1 min")
    expect(utils.formatCookingTime(75)).toBe("1 hr 15 min")
    expect(utils.formatCookingTime(135)).toBe("2 hr 15 min")
  })
})

describe("getDayName", () => {
  it("floors decimals and clamps to [0,6]", () => {
    expect(utils.getDayName(0)).toBe("Sunday")
    expect(utils.getDayName(6)).toBe("Saturday")
    expect(utils.getDayName(2.9)).toBe("Tuesday")
    expect(utils.getDayName(-1)).toBe("Sunday")      // clamped up
    expect(utils.getDayName(7)).toBe("Saturday")     // clamped down
    expect(utils.getDayName(Number.POSITIVE_INFINITY)).toBe("Saturday")
    expect(utils.getDayName(Number.NEGATIVE_INFINITY)).toBe("Sunday")
  })

  it("note: NaN produces undefined at runtime due to Math operations; document current behavior", () => {
    const val = (utils as any).getDayName(NaN)
    expect(val).toBeUndefined()
  })
})

describe("getWeekStart", () => {
  it("returns the Sunday of the same week for a mid-week date", () => {
    // Wed Nov 8, 2023 13:45:00 UTC
    const d = new Date(Date.UTC(2023, 10, 8, 13, 45, 0))
    const start = utils.getWeekStart(d)
    // Sunday Nov 5, 2023 preserving time-of-day (13:45:00 UTC)
    expect(start.toISOString()).toBe(new Date(Date.UTC(2023, 10, 5, 13, 45, 0)).toISOString())
  })

  it("handles month boundary correctly", () => {
    // Mon July 1, 2024 00:00:00 UTC => week start should be Sun June 30, 2024
    const d = new Date(Date.UTC(2024, 6, 1, 0, 0, 0))
    const start = utils.getWeekStart(d)
    expect(start.toISOString().slice(0,10)).toBe("2024-06-30")
  })

  it("preserves the time-of-day from the original date", () => {
    const d = new Date(Date.UTC(2025, 8, 4, 22, 15, 30)) // Thu Sep 4, 2025 UTC
    const start = utils.getWeekStart(d)
    expect(start.getUTCHours()).toBe(22)
    expect(start.getUTCMinutes()).toBe(15)
    expect(start.getUTCSeconds()).toBe(30)
  })
})

describe("formatDate", () => {
  it("formats date to YYYY-MM-DD using UTC (ISO)", () => {
    const d = new Date(Date.UTC(2021, 0, 2, 5, 6, 7)) // 2021-01-02T05:06:07Z
    expect(utils.formatDate(d)).toBe("2021-01-02")
  })

  it("is not affected by local timezone when using UTC dates", () => {
    const d = new Date(Date.UTC(1999, 11, 31, 23, 59, 59))
    expect(utils.formatDate(d)).toBe("1999-12-31")
  })
})

describe("consolidateIngredients", () => {
  it("consolidates by normalized name (case/trim) and final unit, summing adjusted quantities", () => {
    const input = [
      {
        ingredient: { name: "  Sugar", category: "Pantry", unit: "g" },
        quantity: 100,
        servings: 2,
        originalServings: 4,
        recipeTitle: "Cake A"
      },
      {
        ingredient: { name: "sugar", category: "Pantry", unit: "g" },
        quantity: 50,
        servings: 4,
        originalServings: 4,
        recipeTitle: "Cake B"
      },
      {
        // Different unit -> separate entry
        ingredient: { name: "SUGAR", category: "Pantry" },
        unit: "kg",
        quantity: 0.2,
        servings: 1,
        originalServings: 1,
        recipeTitle: "Cake C"
      }
    ] as any

    const out = utils.consolidateIngredients(input)

    // Expect two entries (g + kg), both in category Pantry
    expect(out).toHaveLength(2)
    // Sorted by category; both same, so insertion order is preserved by Map -> array sequence
    const grams = out.find(e => e.unit === "g")!
    const kilos = out.find(e => e.unit === "kg")!

    // Name of consolidated grams entry is from the first seen item: note the leading spaces are preserved
    expect(grams.name).toBe("  Sugar")
    expect(grams.category).toBe("Pantry")
    // adjusted quantities: 100*(2/4)=50 plus 50*(4/4)=50 -> 100
    expect(grams.totalQuantity).toBe(100)
    expect(grams.recipes.sort()).toEqual(["Cake A", "Cake B"])

    expect(kilos.name).toBe("SUGAR")
    expect(kilos.totalQuantity).toBeCloseTo(0.2, 6)
    expect(kilos.recipes).toEqual(["Cake C"])
  })

  it("uses fallback unit 'unit' when neither input.unit nor ingredient.unit provided", () => {
    const input = [
      {
        ingredient: { name: "Eggs", category: "Dairy" },
        quantity: 3,
        servings: 2,
        originalServings: 2
      }
    ] as any

    const [res] = utils.consolidateIngredients(input)
    expect(res.unit).toBe("unit")
    expect(res.totalQuantity).toBe(3)
    expect(res.recipes).toEqual([])
  })

  it("deduplicates recipe titles per entry and sums floating quantities precisely", () => {
    const input = [
      {
        ingredient: { name: "Flour", category: "Pantry", unit: "g" },
        quantity: 33.3333,
        servings: 3,
        originalServings: 3,
        recipeTitle: "Bread"
      },
      {
        ingredient: { name: "Flour", category: "Pantry", unit: "g" },
        quantity: 16.6667,
        servings: 6,
        originalServings: 12,
        recipeTitle: "Bread" // duplicate title should not duplicate in output
      }
    ] as any

    const [res] = utils.consolidateIngredients(input)
    // total = 33.3333*(3/3) + 16.6667*(6/12) = 33.3333 + 8.33335 ≈ 41.66665
    expect(closeTo(res.totalQuantity, 41.66665, 5)).toBe(true)
    expect(res.recipes).toEqual(["Bread"])
  })

  it("sorts results by category ascending", () => {
    const input = [
      { ingredient: { name: "Tomato", category: "Produce", unit: "unit" }, quantity: 1, servings: 1, originalServings: 1 },
      { ingredient: { name: "Milk", category: "Dairy", unit: "L" }, quantity: 1, servings: 1, originalServings: 1 },
      { ingredient: { name: "Pasta", category: "Pantry", unit: "g" }, quantity: 1, servings: 1, originalServings: 1 }
    ] as any

    const out = utils.consolidateIngredients(input)
    expect(out.map(i => i.category)).toEqual(["Dairy", "Pantry", "Produce"])
  })

  it("keeps separate entries when units differ even if names are the same", () => {
    const input = [
      { ingredient: { name: "Olive Oil", category: "Pantry", unit: "ml" }, quantity: 100, servings: 1, originalServings: 1 },
      { ingredient: { name: "Olive Oil", category: "Pantry", unit: "tbsp" }, quantity: 2, servings: 1, originalServings: 1 }
    ] as any

    const out = utils.consolidateIngredients(input)
    expect(out).toHaveLength(2)
    const units = out.map(i => i.unit).sort()
    expect(units).toEqual(["ml", "tbsp"])
  })
})