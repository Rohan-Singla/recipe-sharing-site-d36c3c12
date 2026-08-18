/**
 * Recipes list API.
 *
 * GET /api/recipes returns an array of recipe objects. The in-memory
 * collection is seeded with 8 recipes on the first request if empty.
 */
import { Router } from 'express'
import { collection } from '../store.js'

export const basePath = '/api/recipes'

const SEED = [
  {
    id: '1',
    title: 'Classic Margherita Pizza',
    description: 'A simple Neapolitan pizza with tomato, mozzarella, and fresh basil.',
    imageUrl: 'https://example.com/images/margherita.jpg',
    ingredients: ['pizza dough', 'tomato sauce', 'fresh mozzarella', 'basil leaves', 'olive oil'],
    steps: [
      'Preheat oven to 500°F (260°C).',
      'Stretch the dough into a round base.',
      'Spread tomato sauce and top with mozzarella.',
      'Bake for 10-12 minutes until the crust is golden.',
      'Garnish with basil and a drizzle of olive oil.',
    ],
    author: 'Ava Rossi',
    createdAt: '2024-01-10T09:00:00.000Z',
  },
  {
    id: '2',
    title: 'Creamy Garlic Pasta',
    description: 'A quick weeknight pasta in a rich garlic and parmesan cream sauce.',
    imageUrl: 'https://example.com/images/garlic-pasta.jpg',
    ingredients: ['spaghetti', 'garlic', 'heavy cream', 'parmesan', 'butter', 'parsley'],
    steps: [
      'Cook spaghetti in salted water until al dente.',
      'Melt butter in a pan and sauté minced garlic.',
      'Pour in cream and simmer until slightly thickened.',
      'Toss in the pasta and parmesan.',
      'Finish with parsley and serve warm.',
    ],
    author: 'Marco Chen',
    createdAt: '2024-02-14T18:30:00.000Z',
  },
  {
    id: '3',
    title: 'Spicy Chickpea Curry',
    description: 'A hearty plant-based curry with chickpeas, tomatoes, and warming spices.',
    imageUrl: 'https://example.com/images/chickpea-curry.jpg',
    ingredients: ['chickpeas', 'diced tomatoes', 'onion', 'ginger', 'garlic', 'curry powder', 'coconut milk'],
    steps: [
      'Sauté onion, ginger, and garlic until soft.',
      'Stir in curry powder and cook for one minute.',
      'Add tomatoes, chickpeas, and coconut milk.',
      'Simmer for 20 minutes until thickened.',
      'Season to taste and serve over rice.',
    ],
    author: 'Priya Nair',
    createdAt: '2024-03-05T12:15:00.000Z',
  },
  {
    id: '4',
    title: 'Lemon Herb Roast Chicken',
    description: 'Crispy-skinned roast chicken with lemon, garlic, and fresh herbs.',
    imageUrl: 'https://example.com/images/roast-chicken.jpg',
    ingredients: ['whole chicken', 'lemons', 'garlic', 'rosemary', 'thyme', 'olive oil', 'salt', 'pepper'],
    steps: [
      'Preheat oven to 425°F (220°C).',
      'Pat the chicken dry and rub with olive oil.',
      'Season generously and stuff with lemon and herbs.',
      'Roast for about 1 hour 15 minutes.',
      'Rest for 10 minutes before carving.',
    ],
    author: 'Elena Duarte',
    createdAt: '2024-04-20T16:45:00.000Z',
  },
  {
    id: '5',
    title: 'Blueberry Pancakes',
    description: 'Fluffy buttermilk pancakes loaded with juicy blueberries.',
    imageUrl: 'https://example.com/images/blueberry-pancakes.jpg',
    ingredients: ['flour', 'buttermilk', 'eggs', 'baking powder', 'sugar', 'blueberries', 'maple syrup'],
    steps: [
      'Whisk flour, baking powder, and sugar together.',
      'Mix in buttermilk and eggs until just combined.',
      'Fold in the blueberries gently.',
      'Cook on a buttered griddle until bubbles form.',
      'Flip and cook until golden, then serve with maple syrup.',
    ],
    author: 'Sam Whitfield',
    createdAt: '2024-05-08T08:00:00.000Z',
  },
  {
    id: '6',
    title: 'Beef Tacos',
    description: 'Seasoned ground beef tacos with fresh salsa and lime crema.',
    imageUrl: 'https://example.com/images/beef-tacos.jpg',
    ingredients: ['ground beef', 'taco shells', 'cumin', 'chili powder', 'onion', 'tomatoes', 'cilantro', 'lime'],
    steps: [
      'Brown the ground beef in a skillet.',
      'Add cumin, chili powder, and a splash of water.',
      'Simmer until the beef is well coated.',
      'Warm the taco shells.',
      'Fill with beef, salsa, and a squeeze of lime.',
    ],
    author: 'Lucía Ortega',
    createdAt: '2024-06-11T19:20:00.000Z',
  },
  {
    id: '7',
    title: 'Chocolate Chip Cookies',
    description: 'Chewy, golden-brown cookies with melty chocolate chips.',
    imageUrl: 'https://example.com/images/choc-chip-cookies.jpg',
    ingredients: ['flour', 'butter', 'brown sugar', 'eggs', 'vanilla', 'baking soda', 'chocolate chips'],
    steps: [
      'Cream butter and sugars until light and fluffy.',
      'Beat in eggs and vanilla.',
      'Mix in dry ingredients, then fold in chocolate chips.',
      'Scoop onto a lined baking sheet.',
      'Bake at 350°F (175°C) for 10-12 minutes.',
    ],
    author: 'Grace Lee',
    createdAt: '2024-07-02T15:10:00.000Z',
  },
  {
    id: '8',
    title: 'Greek Salad',
    description: 'A crisp salad of cucumber, tomato, olives, and feta in olive oil.',
    imageUrl: 'https://example.com/images/greek-salad.jpg',
    ingredients: ['cucumber', 'tomatoes', 'red onion', 'kalamata olives', 'feta cheese', 'olive oil', 'oregano'],
    steps: [
      'Chop the cucumber, tomatoes, and red onion.',
      'Combine in a large bowl with olives.',
      'Top with crumbled feta.',
      'Dress with olive oil and oregano.',
      'Toss gently and serve chilled.',
    ],
    author: 'Dimitri Papas',
    createdAt: '2024-08-19T11:40:00.000Z',
  },
]

const router = Router()

router.get('/', (_req, res) => {
  const recipes = collection('recipes')

  // Seed on first request if the collection has never been populated.
  if (recipes.all().length === 0) {
    for (const recipe of SEED) {
      recipes.insert(recipe)
    }
  }

  res.json(recipes.all())
})

export default router
