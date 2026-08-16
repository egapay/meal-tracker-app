/** Must stay in sync with the meal_type CHECK constraint in supabase/schema.sql. */
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

export type MealType = (typeof MEAL_TYPES)[number]

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

/**
 * A row of public.food_entries.
 *
 * Deliberately snake_case, mirroring the table one-to-one. A camelCase domain
 * type plus mappers would be more code for a five-column table used on two
 * screens, and it makes schema.sql harder to check against the app.
 */
export type FoodEntry = {
  id: string
  entry_date: string // YYYY-MM-DD, local calendar date
  meal_type: MealType
  name: string
  protein_grams: number
}

/** Fields the client supplies; user_id comes from the session, the rest default. */
export type NewFoodEntry = Omit<FoodEntry, 'id'>

/** A previously logged food, offered as a one-tap fill in the add sheet. */
export type RecentFood = Pick<FoodEntry, 'name' | 'protein_grams'>

/** A row of public.water_entries. */
export type WaterEntry = {
  id: string
  entry_date: string // YYYY-MM-DD, local calendar date
  drank_at: string // HH:MM:SS, local wall clock
  amount_oz: number
}

export type NewWaterEntry = Omit<WaterEntry, 'id'>

/** Both daily targets from public.profiles. */
export type Goals = {
  protein: number
  waterOz: number
}
