/**
 * Favourites API.
 *
 * Stores favourite recipe IDs in the `favourites` collection and joins them
 * against the `recipes` collection on read. Adding is idempotent: posting the
 * same recipeId twice does not create a duplicate.
 */
import { Router } from 'express'
import { collection } from '../store.js'

export const basePath = '/api/favourites'

const router = Router()

// GET /api/favourites — favourite recipe objects (favourites joined with recipes).
router.get('/', (_req, res) => {
  const favourites = collection('favourites')
  const recipes = collection('recipes')
  const recipeById = new Map(recipes.all().map((recipe) => [String(recipe.id), recipe]))

  const result = favourites
    .all()
    .map((favourite) => recipeById.get(String(favourite.recipeId)))
    .filter(Boolean)

  res.json(result)
})

// POST /api/favourites — add a favourite. Idempotent.
router.post('/', (req, res) => {
  const { recipeId } = req.body ?? {}
  if (recipeId === undefined || recipeId === null || recipeId === '') {
    return res.status(400).json({ error: 'recipeId is required' })
  }

  const favourites = collection('favourites')
  const existing = favourites.all().find((f) => String(f.recipeId) === String(recipeId))
  if (existing) {
    return res.status(201).json(existing)
  }

  const created = favourites.insert({ recipeId })
  res.status(201).json(created)
})

// DELETE /api/favourites/:recipeId — remove a favourite.
router.delete('/:recipeId', (req, res) => {
  const { recipeId } = req.params
  const favourites = collection('favourites')
  const existing = favourites.all().find((f) => String(f.recipeId) === String(recipeId))
  if (existing) {
    favourites.remove(existing.id)
  }
  res.status(204).end()
})

export default router
