import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import {hashPassword} from './services/auth.js';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/learnpath');

const users=[
  {name:'Anita Sharma',email:'teacher@learnpath.com',role:'teacher',password:'Teacher@123',schoolId:'s1',classId:'c1'},
  {name:'Aarav',email:'tom@gmail.com',role:'student',password:'tom123',schoolId:'s1',classId:'c1'},
  {name:'Meera Rao',email:'headteacher@learnpath.com',role:'headteacher',password:'Head@123',schoolId:'s1'},
  {name:'Ravi Kumar',email:'official@learnpath.com',role:'official',password:'Official@123'}
];

for(const u of users){
  await User.updateOne(
    {email:u.email},
    {$set:{
      name:u.name,
      email:u.email,
      role:u.role,
      passwordHash:hashPassword(u.password),
      schoolId:u.schoolId,
      classId:u.classId
    }},
    {upsert:true}
  );
}

console.log('MongoDB reachable. LearnPath demo accounts are ready.');
console.log('Teacher: teacher@learnpath.com / Teacher@123');
console.log('Student: tom@gmail.com / tom123');
console.log('Head Teacher: headteacher@learnpath.com / Head@123');
console.log('Education Official: official@learnpath.com / Official@123');

await mongoose.disconnect();
