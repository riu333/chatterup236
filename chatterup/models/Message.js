import mongoose from 'mongoose';
const messageSchema=new mongoose.Schema({
    userName:String,
    profilePic:String,
    content:String,
    timeStamp:{
        type:Date,
        default:Date.now()
    }
});
export default mongoose.model('Message',messageSchema);