import mongoose from 'mongoose'; export default mongoose.model('AuditLog',new mongoose.Schema({action:String,detail:String,at:Date},{timestamps:true}));
