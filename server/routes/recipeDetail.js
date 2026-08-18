/**
 * Recipe detail endpoint — GET /api/recipes/:id
 *
 * Returns a single recipe object, or 404 when the id is not found.
 * Data is expected to have been seeded by the recipes list API via
 * `collection('recipes', seed)` from server/store.js.
 */
import { Router } from 'express'
import { collection } from '../store.js'

export const basePath = '/api/recipes'

const router = Router()

router.get('/:id', (req, res) => {
  const recipe = collection('recipes').find(req.params.id)
  if (!recipe) {
    return res.status(404).json({ error: 'Not found' })
  }
  res.json(recipe)
})

export default router
