-- Enable Row Level Security on all tables
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Ingredients table is public (no RLS needed as it's shared across users)
-- Users can read all ingredients but only admins can modify them
CREATE POLICY "Anyone can read ingredients" ON ingredients
    FOR SELECT USING (true);

-- Recipes policies
CREATE POLICY "Users can view their own recipes" ON recipes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes" ON recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" ON recipes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" ON recipes
    FOR DELETE USING (auth.uid() = user_id);

-- Recipe ingredients policies
CREATE POLICY "Users can view recipe ingredients for their recipes" ON recipe_ingredients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_ingredients.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert recipe ingredients for their recipes" ON recipe_ingredients
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_ingredients.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update recipe ingredients for their recipes" ON recipe_ingredients
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_ingredients.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete recipe ingredients for their recipes" ON recipe_ingredients
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_ingredients.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

-- Meal plans policies
CREATE POLICY "Users can view their own meal plans" ON meal_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal plans" ON meal_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans" ON meal_plans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans" ON meal_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Meal plan recipes policies
CREATE POLICY "Users can view meal plan recipes for their meal plans" ON meal_plan_recipes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meal_plans 
            WHERE meal_plans.id = meal_plan_recipes.meal_plan_id 
            AND meal_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert meal plan recipes for their meal plans" ON meal_plan_recipes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM meal_plans 
            WHERE meal_plans.id = meal_plan_recipes.meal_plan_id 
            AND meal_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update meal plan recipes for their meal plans" ON meal_plan_recipes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM meal_plans 
            WHERE meal_plans.id = meal_plan_recipes.meal_plan_id 
            AND meal_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete meal plan recipes for their meal plans" ON meal_plan_recipes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM meal_plans 
            WHERE meal_plans.id = meal_plan_recipes.meal_plan_id 
            AND meal_plans.user_id = auth.uid()
        )
    );

-- Shopping lists policies
CREATE POLICY "Users can view their own shopping lists" ON shopping_lists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shopping lists" ON shopping_lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping lists" ON shopping_lists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping lists" ON shopping_lists
    FOR DELETE USING (auth.uid() = user_id);

-- Shopping list items policies
CREATE POLICY "Users can view shopping list items for their shopping lists" ON shopping_list_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shopping_lists 
            WHERE shopping_lists.id = shopping_list_items.shopping_list_id 
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert shopping list items for their shopping lists" ON shopping_list_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM shopping_lists 
            WHERE shopping_lists.id = shopping_list_items.shopping_list_id 
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update shopping list items for their shopping lists" ON shopping_list_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM shopping_lists 
            WHERE shopping_lists.id = shopping_list_items.shopping_list_id 
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete shopping list items for their shopping lists" ON shopping_list_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM shopping_lists 
            WHERE shopping_lists.id = shopping_list_items.shopping_list_id 
            AND shopping_lists.user_id = auth.uid()
        )
    );
