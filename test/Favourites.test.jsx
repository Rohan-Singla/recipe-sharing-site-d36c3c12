import test from 'node:test'
import assert from 'node:assert/strict'
import { loadFavourites, removeFavourite } from '../web/src/pages/Favourites.jsx'

const originalFetch = globalThis.fetch

test.afterEach(() => {
  globalThis.fetch = originalFetch
})

function mockResponse(body, { status = 200 } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

test('loadFavourites fetches GET /api/favourites and returns the list', async () => {
  const favourites = [
    { id: '1', title: 'Pancakes' },
    { id: '2', title: 'Omelette' },
  ]
  const calls = []
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, method: options.method ?? 'GET' })
    return mockResponse(favourites)
  }

  const result = await loadFavourites()

  assert.deepEqual(result, favourites)
  assert.deepEqual(calls, [{ url: '/api/favourites', method: 'GET' }])
})

test('loadFavourites returns an empty array for a non-array payload', async () => {
  globalThis.fetch = async () => mockResponse({ unexpected: true })

  assert.deepEqual(await loadFavourites(), [])
})

test('removeFavourite deletes the recipe and a refetch lists the remainder', async () => {
  let favourites = [
    { id: '1', title: 'Pancakes' },
    { id: '2', title: 'Omelette' },
  ]
  const calls = []
  globalThis.fetch = async (url, options = {}) => {
    const method = options.method ?? 'GET'
    calls.push(`${method} ${url}`)

    if (method === 'DELETE') {
      const id = url.split('/').pop()
      favourites = favourites.filter((f) => String(f.id) !== String(id))
      return { ok: true, status: 204 }
    }

    return mockResponse(favourites)
  }

  await removeFavourite('1')
  const remaining = await loadFavourites()

  assert.deepEqual(remaining, [{ id: '2', title: 'Omelette' }])
  assert.deepEqual(calls, ['DELETE /api/favourites/1', 'GET /api/favourites'])
})

test('removeFavourite rejects when the DELETE request fails', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 500 })

  await assert.rejects(
    () => removeFavourite('9'),
    (err) => err.message.includes('DELETE /api/favourites/9') && err.message.includes('500')
  )
})
