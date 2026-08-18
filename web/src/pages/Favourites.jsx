/**
 * Favourites page.
 *
 * Lists the user's favourite recipes by fetching GET /api/favourites and
 * lets them remove a favourite with DELETE /api/favourites/:recipeId.
 *
 * The data helpers are exported separately so tests can exercise the exact
 * fetch contract without rendering React.
 */
import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'

export const route = '/favourites'
export const title = 'Favourites'

/** Fetch the list of favourite recipes. */
export async function loadFavourites() {
  const data = await api('/api/favourites')
  return Array.isArray(data) ? data : []
}

/** Remove a favourite recipe by id. */
export async function removeFavourite(recipeId) {
  const res = await fetch(`/api/favourites/${recipeId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE /api/favourites/${recipeId} → ${res.status}`)
}

export default function Favourites() {
  const [favourites, setFavourites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [removingId, setRemovingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setFavourites(await loadFavourites())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleRemove(recipeId) {
    setRemovingId(recipeId)
    setError(null)
    try {
      await removeFavourite(recipeId)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="stack">
      <h1>Favourites</h1>

      {error && <p className="muted">Something went wrong: {error}</p>}

      {loading ? (
        <p className="muted">Loading your favourites…</p>
      ) : favourites.length === 0 ? (
        <div className="empty">
          <h2>No favourites yet</h2>
          <p className="muted">Recipes you save will show up here.</p>
        </div>
      ) : (
        <ul className="routes">
          {favourites.map((recipe) => (
            <li key={recipe.id}>
              <a href={`#/recipes/${recipe.id}`} style={{ flex: 1 }}>
                {recipe.title}
              </a>
              <button
                onClick={() => handleRemove(recipe.id)}
                disabled={removingId === recipe.id}
              >
                {removingId === recipe.id ? 'Removing…' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
