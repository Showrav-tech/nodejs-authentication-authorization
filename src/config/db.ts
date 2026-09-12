import mongoose from "mongoose";

export async function connectToDB(){
try{
    await mongoose.connect(process.env.MONGO_URI!);
   console.log("Mongo Connection is successfully connected");
}catch (err){

console.error("Mongodb connection error!");
process.exit(1);

}



}