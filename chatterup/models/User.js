import mongoose from "mongoose";
const userSchema=new mongoose.Schema({
    socketId:String,
    name:{
        type:String,
        required:true
    },
    profilePic:{
        type:String
    },
    joinedAt:{
        type:Date,
        default:Date.now
    }});

export default mongoose.model('User',userSchema);
    
