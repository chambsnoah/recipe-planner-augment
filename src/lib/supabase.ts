import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Check if we have valid Supabase configuration
export const hasValidSupabaseConfig = () => {
  // For now, always return false to use localStorage
  // TODO: Implement proper Supabase configuration check
  return false

  // Original logic (commented out for now):
  // return supabaseUrl !== 'https://placeholder.supabase.co' &&
  //        supabaseUrl !== 'https://your-project.supabase.co' &&
  //        supabaseAnonKey !== 'placeholder-key' &&
  //        supabaseAnonKey !== 'your_supabase_anon_key_here' &&
  //        supabaseUrl.includes('supabase.co') &&
  //        !supabaseUrl.includes('your-project') &&
  //        supabaseAnonKey.length > 20
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function createSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

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
