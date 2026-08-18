import test from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../server/index.js'

const REQUIRED_FIELDS = [
  'id',
  'title',
  'description',
  'imageUrl',
  'ingredients',
  'steps',
  'author',
  'createdAt',
]

test('GET /api/recipes returns 200 and an array', async () => {
  const app = await createApp()
  const res = await request(app).get('/api/recipes')
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.body))
})

test('GET /api/recipes contains the 8 seeded recipes', async () => {
  const app = await createApp()
  const res = await request(app).get('/api/recipes')
  assert.equal(res.body.length, 8)
  const ids = res.body.map((r) => r.id).sort()
  assert.deepEqual(ids, ['1', '2', '3', '4', '5', '6', '7', '8'])
})

test('each recipe has all required fields with correct types', async () => {
  const app = await createApp()
  const res = await request(app).get('/api/recipes')

  for (const recipe of res.body) {
    for (const field of REQUIRED_FIELDS) {
      assert.ok(field in recipe, `recipe ${recipe.id} is missing field "${field}"`)
    }

    assert.equal(typeof recipe.id, 'string')
    assert.equal(typeof recipe.title, 'string')
    assert.equal(typeof recipe.description, 'string')
    assert.equal(typeof recipe.imageUrl, 'string')
    assert.ok(Array.isArray(recipe.ingredients), `recipe ${recipe.id} ingredients should be an array`)
    assert.ok(
      recipe.ingredients.every((i) => typeof i === 'string'),
      `recipe ${recipe.id} ingredients should only contain strings`
    )
    assert.ok(Array.isArray(recipe.steps), `recipe ${recipe.id} steps should be an array`)
    assert.ok(
      recipe.steps.every((s) => typeof s === 'string'),
      `recipe ${recipe.id} steps should only contain strings`
    )
    assert.equal(typeof recipe.author, 'string')
    assert.equal(typeof recipe.createdAt, 'string')
    assert.ok(
      !Number.isNaN(Date.parse(recipe.createdAt)),
      `recipe ${recipe.id} createdAt should be a valid ISO date string`
    )
  }
})
