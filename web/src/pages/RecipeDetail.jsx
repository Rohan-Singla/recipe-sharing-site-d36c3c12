/**
 * RecipeDetail page — shows a single recipe and lets the user favourite it.
 *
 * The recipe id comes from the hash route (e.g. #/recipes/3). Because the
 * app's shared router matches exact page routes, this page also accepts an
 * `id` prop so tests can render it directly without manipulating the URL.
 *
 * Data contract:
 *   - GET  /api/recipes/:id        → recipe object or 404
 *   - GET  /api/favourites         → favourite recipe objects
 *   - POST /api/favourites         → add a favourite  { recipeId }
 *   - DELETE /api/favourites/:id   → remove a favourite
 */
import { useEffect, useState } from 'react'
import { api } from '../api.js'

export const route = '/recipes/:id'
export const title = ''

/** Extract the recipe id from a hash route like "#/recipes/42". */
export function recipeIdFromHash(hash) {
  const value = hash ?? (typeof window !== 'undefined' ? window.location.hash : '')
  const match = value.match(/^#\/recipes\/([^/?#]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

/** Fetch a single recipe. Returns null when the recipe does not exist. */
export async function loadRecipe(id) {
  const res = await fetch(`/api/recipes/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GET /api/recipes/${id} → ${res.status}`)
  return res.json()
}

/** Fetch the current favourite recipe objects. */
export async function loadFavourites() {
  const data = await api('/api/favourites')
  return Array.isArray(data) ? data : []
}

/** Add a recipe to favourites. */
export async function addFavourite(recipeId) {
  return api('/api/favourites', { method: 'POST', body: { recipeId } })
}

/** Remove a recipe from favourites. */
export async function removeFavourite(recipeId) {
  const res = await fetch(`/api/favourites/${recipeId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE /api/favourites/${recipeId} → ${res.status}`)
}

export default function RecipeDetail({ id: idProp } = {}) {
  const id = idProp ?? recipeIdFromHash()

  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  // null means "favourites not loaded yet"; an array of recipe ids once known.
  const [favouriteIds, setFavouriteIds] = useState(null)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (!id) {
      setError('No recipe id provided')
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setNotFound(false)

      try {
        const recipe = await loadRecipe(id)
        if (cancelled) return

        if (recipe === null) {
          setNotFound(true)
          return
        }

        setRecipe(recipe)

        try {
          const favourites = await loadFavourites()
          if (!cancelled) setFavouriteIds(favourites.map((f) => String(f.id)))
        } catch {
          // The recipe can still be shown even if favourites can't be read.
          if (!cancelled) setFavouriteIds([])
        }
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load recipe')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [id])

  async function handleToggle() {
    if (!recipe || toggling || favouriteIds === null) return

    const isFavourite = favouriteIds.includes(String(recipe.id))
    setToggling(true)
    setError(null)

    try {
      if (isFavourite) {
        await removeFavourite(recipe.id)
        setFavouriteIds((ids) => ids.filter((recipeId) => recipeId !== String(recipe.id)))
      } else {
        await addFavourite(recipe.id)
        setFavouriteIds((ids) => Array.from(new Set([...ids, String(recipe.id)])))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update favourites')
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return <div className="empty">Loading recipe…</div>
  }

  if (notFound) {
    return (
      <div className="empty">
        <h1>Recipe not found</h1>
        <p className="muted">The recipe you are looking for does not exist.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="empty">
        <h1>Something went wrong</h1>
        <p className="muted">{error}</p>
      </div>
    )
  }

  if (!recipe) {
    return <div className="empty">Recipe not found.</div>
  }

  const isFavourite = (favouriteIds ?? []).includes(String(recipe.id))
  const date = recipe.createdAt
    ? new Date(recipe.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="stack">
      {recipe.imageUrl ? (
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          style={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 12 }}
        />
      ) : null}

      <h1>{recipe.title}</h1>
      <p className="muted">
        By {recipe.author}
        {date ? ` · ${date}` : ''}
      </p>
      <p>{recipe.description}</p>

      <section>
        <h2>Ingredients</h2>
        <ul>
          {(recipe.ingredients ?? []).map((ingredient, index) => (
            <li key={index}>{ingredient}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Steps</h2>
        <ol>
          {(recipe.steps ?? []).map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </section>

      {error && <p className="muted">Something went wrong: {error}</p>}

      <button onClick={handleToggle} disabled={toggling || favouriteIds === null}>
        {favouriteIds === null
          ? 'Checking…'
          : isFavourite
            ? toggling
              ? 'Removing…'
              : 'Remove from favourites'
            : toggling
              ? 'Adding…'
              : 'Add to favourites'}
      </button>
    </div>
  )
}
