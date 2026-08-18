import test from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../server/index.js'
import { collection, resetStore } from '../server/store.js'

const seedRecipes = [
  { id: '1', title: 'Pancakes' },
  { id: '2', title: 'Omelette' },
]

test.beforeEach(() => {
  resetStore()
  collection('recipes', seedRecipes)
})

test('POST /api/favourites adds a favourite and returns 201', async () => {
  const app = await createApp()
  const res = await request(app).post('/api/favourites').send({ recipeId: '1' })

  assert.equal(res.status, 201)
  assert.equal(res.body.recipeId, '1')
  assert.ok(res.body.id)
})

test('POST /api/favourites is idempotent', async () => {
  const app = await createApp()

  const first = await request(app).post('/api/favourites').send({ recipeId: '1' })
  const second = await request(app).post('/api/favourites').send({ recipeId: '1' })

  assert.equal(first.status, 201)
  assert.equal(second.status, 201)
  assert.equal(second.body.id, first.body.id)

  const list = await request(app).get('/api/favourites')
  assert.equal(list.status, 200)
  assert.equal(list.body.length, 1)
})

test('GET /api/favourites returns joined recipe objects', async () => {
  const app = await createApp()

  await request(app).post('/api/favourites').send({ recipeId: '2' })
  await request(app).post('/api/favourites').send({ recipeId: '1' })

  const res = await request(app).get('/api/favourites')

  assert.equal(res.status, 200)
  assert.deepEqual(res.body, [
    { id: '2', title: 'Omelette' },
    { id: '1', title: 'Pancakes' },
  ])
})

test('DELETE /api/favourites/:recipeId removes a favourite and returns 204', async () => {
  const app = await createApp()

  await request(app).post('/api/favourites').send({ recipeId: '1' })
  const del = await request(app).delete('/api/favourites/1')

  assert.equal(del.status, 204)

  const res = await request(app).get('/api/favourites')
  assert.deepEqual(res.body, [])
})

test('DELETE /api/favourites/:recipeId is idempotent', async () => {
  const app = await createApp()

  await request(app).post('/api/favourites').send({ recipeId: '1' })
  const first = await request(app).delete('/api/favourites/1')
  const second = await request(app).delete('/api/favourites/1')

  assert.equal(first.status, 204)
  assert.equal(second.status, 204)
})
