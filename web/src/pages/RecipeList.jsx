/**
 * RecipeList page — lists every recipe from GET /api/recipes in a grid.
 *
 * Each card shows the recipe image, title, and short description, and links to
 * the recipe detail route /recipes/:id. Includes loading, error, and empty states.
 */
import { useEffect, useState } from 'react'
import { api } from '../api.js'

export const route = '/recipes'
export const title = 'Recipes'

export default function RecipeList() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    api('/api/recipes')
      .then((data) => {
        if (cancelled) return
        setRecipes(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load recipes')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <div className="empty">Loading recipes…</div>
  }

  if (error) {
    return (
      <div className="empty">
        <h1>Something went wrong</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (recipes.length === 0) {
    return <div className="empty">No recipes found.</div>
  }

  return (
    <div className="stack">
      <h1>Recipes</h1>
      <div className="grid">
        {recipes.map((recipe) => (
          <article key={recipe.id} className="card">
            {recipe.imageUrl ? (
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                loading="lazy"
                style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }}
              />
            ) : null}
            <h3>
              <a href={`#/recipes/${recipe.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {recipe.title}
              </a>
            </h3>
            <p className="muted">{recipe.description}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
