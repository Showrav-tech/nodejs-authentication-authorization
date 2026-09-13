import {connectToDB} from "./config/db";
import http from "http";

import express from "express";

const app = express();
import dotenv from "dotenv";

dotenv.config();

async function  startServer(){

await connectToDB()
const server =http.createServer(app);

server.listen(process.env.PORT,()=>{
console.log(`Server is now listrning to port ${process.env.PORT}`);

})


}
startServer().catch((err)=>{
console.error("Error while starting the server",err);
process.exit(1);


});