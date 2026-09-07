import express from 'express'; import cors from 'cors'; import mongoose from 'mongoose'; import dotenv from 'dotenv';
import {demo} from './services/demoData.js'; import api from './routes/api.js';
dotenv.config(); const app=express(); app.use(cors()); app.use(express.json());
let mongo=false;
if(process.env.MONGODB_URI){ mongoose.connect(process.env.MONGODB_URI).then(()=>{mongo=true; console.log('MongoDB connected')}).catch((err)=>console.log('MongoDB unavailable — using demo mode:',err.message)); } else { mongoose.connect('mongodb://127.0.0.1:27017/learnpath').then(()=>{mongo=true; console.log('MongoDB connected')}).catch((err)=>console.log('MongoDB unavailable — using demo mode:',err.message)); }
app.get('/api/health',(req,res)=>res.json({ok:true,mongodb:mongo,mode:mongo?'mongodb':'demo'}));
app.use('/api',api);
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({message:err.message||'Server error'})});
app.listen(process.env.PORT||5000,()=>console.log(`LearnPath API on http://localhost:${process.env.PORT||5000}`));
