/**
 * Frontend test for the RecipeList page.
 *
 * Targets a Vite + Vitest + Testing Library setup (jsdom environment). It
 * verifies the component's real fetch behaviour by stubbing globalThis.fetch:
 *   - a loading state while the request is pending
 *   - recipe cards (image, title, description, detail link) on success
 *   - an error state when the request fails
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import RecipeList from '../web/src/pages/RecipeList.jsx'

const RECIPES = [
  {
    id: '1',
    title: 'Classic Margherita Pizza',
    description: 'A simple Neapolitan pizza with tomato, mozzarella, and fresh basil.',
    imageUrl: 'https://example.com/images/margherita.jpg',
  },
  {
    id: '2',
    title: 'Creamy Garlic Pasta',
    description: 'A quick weeknight pasta in a rich garlic and parmesan cream sauce.',
    imageUrl: 'https://example.com/images/garlic-pasta.jpg',
  },
]

let fetchMock

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('RecipeList', () => {
  it('shows a loading state while the request is in flight', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))

    render(<RecipeList />)

    expect(screen.getByText('Loading recipes…')).toBeTruthy()
  })

  it('renders recipe cards after a successful fetch', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => RECIPES,
    })

    render(<RecipeList />)

    await waitFor(() => {
      expect(screen.getByText('Classic Margherita Pizza')).toBeTruthy()
    })

    expect(screen.getByText('Creamy Garlic Pasta')).toBeTruthy()
    expect(screen.getByText(RECIPES[0].description)).toBeTruthy()

    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
    expect(images[0].getAttribute('src')).toBe(RECIPES[0].imageUrl)
    expect(images[0].getAttribute('alt')).toBe(RECIPES[0].title)

    const link = screen.getByRole('link', { name: 'Classic Margherita Pizza' })
    expect(link.getAttribute('href')).toBe('#/recipes/1')
  })

  it('shows an error state when the fetch fails', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'))

    render(<RecipeList />)

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeTruthy()
    })

    expect(screen.getByText('Network error')).toBeTruthy()
  })
})
