-- Insert common ingredients with categories
INSERT INTO ingredients (name, category, unit) VALUES
-- Proteins
('Chicken breast', 'Protein', 'lb'),
('Ground beef', 'Protein', 'lb'),
('Salmon fillet', 'Protein', 'lb'),
('Eggs', 'Protein', 'dozen'),
('Tofu', 'Protein', 'lb'),
('Black beans', 'Protein', 'can'),
('Chickpeas', 'Protein', 'can'),

-- Vegetables
('Onion', 'Vegetables', 'piece'),
('Garlic', 'Vegetables', 'clove'),
('Carrots', 'Vegetables', 'lb'),
('Celery', 'Vegetables', 'stalk'),
('Bell peppers', 'Vegetables', 'piece'),
('Tomatoes', 'Vegetables', 'lb'),
('Spinach', 'Vegetables', 'bunch'),
('Broccoli', 'Vegetables', 'head'),
('Mushrooms', 'Vegetables', 'lb'),
('Potatoes', 'Vegetables', 'lb'),
('Sweet potatoes', 'Vegetables', 'lb'),

-- Fruits
('Bananas', 'Fruits', 'bunch'),
('Apples', 'Fruits', 'lb'),
('Lemons', 'Fruits', 'piece'),
('Limes', 'Fruits', 'piece'),
('Avocados', 'Fruits', 'piece'),

-- Grains & Starches
('Rice', 'Grains', 'lb'),
('Pasta', 'Grains', 'lb'),
('Bread', 'Grains', 'loaf'),
('Quinoa', 'Grains', 'lb'),
('Oats', 'Grains', 'lb'),

-- Dairy
('Milk', 'Dairy', 'gallon'),
('Cheese', 'Dairy', 'lb'),
('Greek yogurt', 'Dairy', 'container'),
('Butter', 'Dairy', 'lb'),

-- Pantry
('Olive oil', 'Pantry', 'bottle'),
('Salt', 'Pantry', 'container'),
('Black pepper', 'Pantry', 'container'),
('Garlic powder', 'Pantry', 'container'),
('Paprika', 'Pantry', 'container'),
('Cumin', 'Pantry', 'container'),
('Oregano', 'Pantry', 'container'),
('Basil', 'Pantry', 'container'),
('Thyme', 'Pantry', 'container'),
('Bay leaves', 'Pantry', 'container'),
('Soy sauce', 'Pantry', 'bottle'),
('Vinegar', 'Pantry', 'bottle'),
('Honey', 'Pantry', 'jar'),
('Flour', 'Pantry', 'lb'),
('Sugar', 'Pantry', 'lb'),
('Baking powder', 'Pantry', 'container'),
('Vanilla extract', 'Pantry', 'bottle'),

-- Canned/Jarred
('Diced tomatoes', 'Canned', 'can'),
('Tomato paste', 'Canned', 'can'),
('Coconut milk', 'Canned', 'can'),
('Chicken broth', 'Canned', 'carton'),
('Vegetable broth', 'Canned', 'carton');

-- Note: We'll add sample recipes after users are created through the application
-- This is because recipes need to be associated with user accounts
