const mongoose = require("mongoose");
const connectDB=async()=>{
    try{
        const connect=await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

    }catch(error){
        console.error("Error connecting to MongoDB:", error);
    }
}
module.exports=connectDB;