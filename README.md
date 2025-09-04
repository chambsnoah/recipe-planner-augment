# Recipe Planner

A modern web application that makes meal planning effortless and produces customizable shopping lists. Built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Recipe Management**: Add, edit, and organize your recipe collection with images, ingredients, and dietary tags
- **Smart Search & Filtering**: Find recipes by dietary restrictions, cooking time, meal type, and ingredients
- **Weekly Meal Planning**: Drag-and-drop interface for planning meals across the week
- **Automatic Shopping Lists**: Generate consolidated shopping lists from your meal plan with serving size adjustments
- **Shopping List Organization**: Organize ingredients by category and store section with drag-and-drop functionality
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Drag & Drop**: @dnd-kit

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd recipe-planner
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Set up the database:
   - Create a new Supabase project
   - Run the migration files in `supabase/migrations/` in order:
     - `001_initial_schema.sql` - Creates tables and indexes
     - `002_seed_data.sql` - Adds sample ingredients
     - `003_rls_policies.sql` - Sets up Row Level Security

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses the following main tables:

- **recipes**: Store recipe information (title, description, cooking time, etc.)
- **ingredients**: Master list of ingredients with categories
- **recipe_ingredients**: Junction table linking recipes to ingredients with quantities
- **meal_plans**: Weekly meal plans for users
- **meal_plan_recipes**: Specific recipes assigned to days/meals
- **shopping_lists**: Generated shopping lists
- **shopping_list_items**: Individual items in shopping lists

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Homepage
│   ├── recipes/           # Recipe management pages
│   ├── meal-plan/         # Meal planning interface
│   └── shopping-list/     # Shopping list management
├── lib/                   # Utility functions and configurations
│   ├── supabase.ts       # Supabase client setup
│   └── utils.ts          # Helper functions
└── components/            # Reusable React components (future)

supabase/
└── migrations/            # Database migration files
```

## Features in Detail

### Recipe Management
- Add recipes with ingredients, cooking time, servings, and dietary tags
- Upload recipe images or link to external recipes
- Filter and search through your recipe collection
- Adjust serving sizes dynamically

### Meal Planning
- Weekly calendar view for planning meals
- Drag-and-drop recipes into time slots
- Navigate between weeks easily
- Visual meal organization

### Shopping Lists
- Automatically consolidate ingredients from meal plans
- Group items by category (produce, dairy, pantry, etc.)
- Mark items as purchased with progress tracking
- Drag-and-drop organization by store layout

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- Icons by [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
