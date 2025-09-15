import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Check if we have valid Supabase configuration
export const hasValidSupabaseConfig = (): boolean => {
  // Basic validation to detect placeholder values and obvious misconfigurations
  if (!supabaseUrl || !supabaseAnonKey) return false
  if (supabaseUrl.includes('placeholder.supabase.co')) return false
  if (supabaseUrl.includes('your-project')) return false
  if (!supabaseUrl.includes('supabase.co')) return false
  if (supabaseAnonKey.length < 20) return false
  return true
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// Use any for client generics to avoid mismatches between local types and runtime shape
export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey)

/**
 * Creates a browser-oriented Supabase client using the module's configured URL and anon key.
 *
 * Returns a Supabase client instance (typed as `any`) configured with `supabaseUrl` and `supabaseAnonKey`.
 */
export function createSupabaseClient(): any {
  return createBrowserClient<any>(supabaseUrl, supabaseAnonKey)
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// Database types will be generated here later
export type Database = {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string | null
          external_url: string | null
          cooking_time: number | null
          servings: number
          meal_type: string[]
          dietary_tags: string[]
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url?: string | null
          external_url?: string | null
          cooking_time?: number | null
          servings: number
          meal_type: string[]
          dietary_tags: string[]
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          external_url?: string | null
          cooking_time?: number | null
          servings?: number
          meal_type?: string[]
          dietary_tags?: string[]
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      ingredients: {
        Row: {
          id: string
          name: string
          category: string
          unit: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          unit?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          unit?: string | null
          created_at?: string
        }
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          ingredient_id: string
          quantity: number
          unit: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          ingredient_id: string
          quantity: number
          unit?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          ingredient_id?: string
          quantity?: number
          unit?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      meal_plans: {
        Row: {
          id: string
          user_id: string
          week_start: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          created_at?: string
          updated_at?: string
        }
      }
      meal_plan_recipes: {
        Row: {
          id: string
          meal_plan_id: string
          recipe_id: string
          day_of_week: number
          meal_type: string
          servings: number
          created_at: string
        }
        Insert: {
          id?: string
          meal_plan_id: string
          recipe_id: string
          day_of_week: number
          meal_type: string
          servings: number
          created_at?: string
        }
        Update: {
          id?: string
          meal_plan_id?: string
          recipe_id?: string
          day_of_week?: number
          meal_type?: string
          servings?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
