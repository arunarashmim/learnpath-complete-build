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

// Create one shared connection promise.
// This prevents Vercel requests from reaching the API
// before MongoDB has finished connecting.
const mongoConnection = mongoose
  .connect(mongoUri)
  .then(() => {
    mongo = true
    console.log('MongoDB connected successfully')
  })
  .catch((err) => {
    mongo = false
    console.log(
      'MongoDB unavailable — using demo mode:',
      err.message
    )
  })

// Wait for the MongoDB connection before handling API requests.
// This is especially important on Vercel/serverless cold starts.
app.use(async (req, res, next) => {
  try {
    await mongoConnection
  } catch {
    // If MongoDB is unavailable, continue in demo mode.
  }

  next()
})

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mongodb: mongo,
    mode: mongo ? 'mongodb' : 'demo'
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