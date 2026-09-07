import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

import api from './routes/api.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/learnpath'

let mongo = false
let mongoError = null
let mongoPromise = null

async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    mongo = true
    mongoError = null
    return true
  }

  if (mongoPromise) {
    return mongoPromise
  }

  mongoPromise = mongoose
    .connect(mongoUri, {
      family: 4,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      maxIdleTimeMS: 60000
    })
    .then(() => {
      mongo = true
      mongoError = null
      console.log('MongoDB connected successfully')
      return true
    })
    .catch((err) => {
      mongo = false
      mongoError = err

      console.error('MongoDB connection failed')
      console.error('Name:', err?.name)
      console.error('Message:', err?.message)
      console.error('Code:', err?.code || 'none')

      mongoPromise = null

      return false
    })

  return mongoPromise
}

app.use(async (req, res, next) => {
  await connectMongo()
  next()
})

app.get('/api/health', async (req, res) => {
  const connected = await connectMongo()

  res.json({
    ok: true,
    mongodb: connected,
    mode: connected ? 'mongodb' : 'demo',
    error: connected
      ? null
      : mongoError?.name || 'MongoDB connection failed'
  })
})

app.use('/api', api)

app.use((err, req, res, next) => {
  console.error(err)

  res.status(500).json({
    message: err.message || 'Server error'
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`LearnPath API on http://localhost:${PORT}`)
})