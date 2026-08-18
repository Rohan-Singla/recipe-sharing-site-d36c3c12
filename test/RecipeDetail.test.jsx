/**
 * Frontend test for the RecipeDetail page.
 *
 * Targets a Vite + Vitest + Testing Library setup (jsdom environment). It
 * stubs globalThis.fetch and verifies:
 *   - the route-param id helper
 *   - loading, not-found, and error states
 *   - full recipe display (title, image, description, ingredients, steps,
 *     author, date)
 *   - the favourite toggle (POST to add, DELETE to remove)
 */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import RecipeDetail, {
  addFavourite,
  loadFavourites,
  loadRecipe,
  recipeIdFromHash,
  removeFavourite,
} from '../web/src/pages/RecipeDetail.jsx'

const RECIPE = {
  id: '1',
  title: 'Classic Margherita Pizza',
  description: 'A simple Neapolitan pizza with tomato, mozzarella, and fresh basil.',
  imageUrl: 'https://example.com/images/margherita.jpg',
  ingredients: ['pizza dough', 'tomato sauce', 'fresh mozzarella', 'basil leaves', 'olive oil'],
  steps: [
    'Preheat oven to 500°F (260°C).',
    'Stretch the dough into a round base.',
    'Bake for 10-12 minutes until the crust is golden.',
  ],
  author: 'Ava Rossi',
  createdAt: '2024-01-10T09:00:00.000Z',
}

function jsonResponse(body, { status = 200 } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

/**
 * Build a small in-memory recipe API as a fetch mock. `favourites` is an
 * array of favourite recipe objects and is mutated by POST/DELETE.
 */
function createRecipeApi({ recipe = RECIPE, favourites = [] } = {}) {
  const calls = []
  const state = { favourites: [...favourites] }

  const fetchMock = vi.fn(async (url, options = {}) => {
    const method = (options.method ?? 'GET').toUpperCase()
    calls.push(`${method} ${url}`)

    if (method === 'GET' && url === `/api/recipes/${recipe.id}`) {
      return jsonResponse(recipe)
    }

    if (method === 'GET' && url === '/api/favourites') {
      return jsonResponse(state.favourites)
    }

    if (method === 'POST' && url === '/api/favourites') {
      const body = JSON.parse(options.body ?? '{}')
      if (!state.favourites.some((f) => String(f.id) === String(body.recipeId))) {
        state.favourites.push({ id: body.recipeId, title: recipe.title })
      }
      return jsonResponse({ id: 'fav-1', recipeId: body.recipeId }, { status: 201 })
    }

    if (method === 'DELETE' && url.startsWith('/api/favourites/')) {
      const recipeId = url.split('/').pop()
      state.favourites = state.favourites.filter((f) => String(f.id) !== String(recipeId))
      return { ok: true, status: 204, json: async () => ({}) }
    }

    return jsonResponse({ error: 'Not found' }, { status: 404 })
  })

  return { fetchMock, calls, state }
}

let api

beforeEach(() => {
  api = createRecipeApi()
  vi.stubGlobal('fetch', api.fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('recipeIdFromHash', () => {
  it('extracts the id from a #/recipes/:id hash', () => {
    expect(recipeIdFromHash('#/recipes/42')).toBe('42')
  })

  it('returns null for unrelated hashes', () => {
    expect(recipeIdFromHash('#/recipes')).toBe(null)
    expect(recipeIdFromHash('#/favourites')).toBe(null)
  })
})

describe('RecipeDetail', () => {
  it('shows a loading state while the request is in flight', () => {
    api.fetchMock.mockReturnValue(new Promise(() => {}))

    render(<RecipeDetail id="1" />)

    expect(screen.getByText('Loading recipe…')).toBeTruthy()
  })

  it('renders the full recipe after a successful fetch', async () => {
    render(<RecipeDetail id="1" />)

    await screen.findByText('Classic Margherita Pizza')

    expect(screen.getByText(RECIPE.description)).toBeTruthy()

    const image = screen.getByRole('img', { name: RECIPE.title })
    expect(image.getAttribute('src')).toBe(RECIPE.imageUrl)

    expect(screen.getByText(/Ava Rossi/)).toBeTruthy()
    expect(screen.getByText(/January 10, 2024/)).toBeTruthy()

    for (const ingredient of RECIPE.ingredients) {
      expect(screen.getByText(ingredient)).toBeTruthy()
    }

    for (const step of RECIPE.steps) {
      expect(screen.getByText(step)).toBeTruthy()
    }

    expect(screen.getByRole('button', { name: 'Add to favourites' })).toBeTruthy()
  })

  it('shows a not-found state when the recipe id does not exist', async () => {
    api.fetchMock.mockImplementation(async (url) => {
      if (url === '/api/recipes/999') {
        return jsonResponse({ error: 'Not found' }, { status: 404 })
      }
      return jsonResponse([])
    })

    render(<RecipeDetail id="999" />)

    await screen.findByText('Recipe not found')
    expect(screen.getByText(/does not exist/)).toBeTruthy()
  })

  it('shows an error state when the recipe fetch fails', async () => {
    api.fetchMock.mockRejectedValue(new Error('Network error'))

    render(<RecipeDetail id="1" />)

    await screen.findByText(/something went wrong/i)
    expect(screen.getByText('Network error')).toBeTruthy()
  })

  it('toggles a favourite from off to on and back off again', async () => {
    render(<RecipeDetail id="1" />)

    const addButton = await screen.findByRole('button', { name: 'Add to favourites' })

    fireEvent.click(addButton)

    const removeButton = await screen.findByRole('button', { name: 'Remove from favourites' })
    expect(removeButton).toBeTruthy()

    fireEvent.click(removeButton)

    await screen.findByRole('button', { name: 'Add to favourites' })

    expect(api.calls).toEqual([
      'GET /api/recipes/1',
      'GET /api/favourites',
      'POST /api/favourites',
      'DELETE /api/favourites/1',
    ])
  })

  it('starts with the button reflecting an already-favourited recipe', async () => {
    api = createRecipeApi({ favourites: [{ id: '1', title: RECIPE.title }] })
    vi.stubGlobal('fetch', api.fetchMock)

    render(<RecipeDetail id="1" />)

    await screen.findByRole('button', { name: 'Remove from favourites' })
  })
})

describe('RecipeDetail data helpers', () => {
  it('loadRecipe returns the recipe for a found id', async () => {
    const recipe = await loadRecipe('1')
    expect(recipe).toEqual(RECIPE)
  })

  it('loadRecipe returns null for a 404', async () => {
    api.fetchMock.mockImplementation(async () =>
      jsonResponse({ error: 'Not found' }, { status: 404 })
    )
    expect(await loadRecipe('404')).toBe(null)
  })

  it('loadFavourites returns an array of favourites', async () => {
    api.fetchMock.mockResolvedValueOnce(jsonResponse([{ id: '1', title: RECIPE.title }]))
    expect(await loadFavourites()).toEqual([{ id: '1', title: RECIPE.title }])
  })

  it('addFavourite POSTs the recipeId', async () => {
    await addFavourite('1')
    expect(api.calls).toContain('POST /api/favourites')
  })

  it('removeFavourite DELETEs the recipeId', async () => {
    await removeFavourite('1')
    expect(api.calls).toContain('DELETE /api/favourites/1')
  })
})
