import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { demo } from './services/demoData.js';
import api from './routes/api.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

let mongo = false;
let mongoConnection = null;

const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/learnpath';

console.log(
  'MongoDB URI configured:',
  process.env.MONGODB_URI ? 'YES' : 'NO'
);

async function connectMongo() {
  try {
    mongoConnection = mongoose.connect(mongoUri);

    await mongoConnection;

    mongo = true;

    console.log('MongoDB connected successfully');
  } catch (err) {
    mongo = false;

    console.log(
      'MongoDB unavailable — using demo mode:',
      err.message
    );
  }
}

const mongoReady = connectMongo();

app.get('/api/health', async (req, res) => {
  await mongoReady;

  res.json({
    ok: true,
    mongodb: mongo,
    mode: mongo ? 'mongodb' : 'demo'
  });
});

app.use('/api', api);

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    message: err.message || 'Server error'
  });
});

app.listen(
  process.env.PORT || 5000,
  () => {
    console.log(
      `LearnPath API on http://localhost:${process.env.PORT || 5000}`
    );
  }
);