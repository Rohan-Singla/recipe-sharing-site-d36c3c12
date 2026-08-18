import test from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../server/index.js'
import { collection, resetStore } from '../server/store.js'

test('found recipe returns 200 and the correct object', async () => {
  resetStore()
  const seeded = [
    { id: '1', name: 'Pancakes', ingredients: ['flour', 'milk', 'egg'] },
    { id: '2', name: 'Omelette', ingredients: ['egg', 'butter', 'salt'] },
  ]
  collection('recipes', seeded)

  const app = await createApp()
  const res = await request(app).get('/api/recipes/2')

  assert.equal(res.status, 200)
  assert.deepEqual(res.body, seeded[1])
})

test('non-existent id returns 404', async () => {
  resetStore()
  collection('recipes', [
    { id: '1', name: 'Pancakes', ingredients: ['flour', 'milk', 'egg'] },
  ])

  const app = await createApp()
  const res = await request(app).get('/api/recipes/999')

  assert.equal(res.status, 404)
  assert.ok(res.body.error)
})
