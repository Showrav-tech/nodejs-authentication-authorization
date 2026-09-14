import {Request,Response} from "express";
import { registerSchema } from "./auth.schema";



export async function registerHandler (req:Request,res:Response){
try{
  const result = registerSchema.safeParse(req.body);
 if(!result.success){
    return res.status(400).json({
message :'Invalid data!',errors:result.error.flatten()


    })
 }
const {name,email,password}=result.data;

}catch(err){

}

}