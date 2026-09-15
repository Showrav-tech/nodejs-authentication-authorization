import {Request,Response} from "express";
import { registerSchema } from "./auth.schema";
import { User } from "../../models/user.model";
import { hashPassword } from "../../lib/hash";
import jwt from 'jsonwebtoken';


function getAppUrl(){

return process.env.APP_URL || `http://localhost:${process.env.PORT}`


}



export async function registerHandler (req:Request,res:Response){
try{
  const result = registerSchema.safeParse(req.body);
 if(!result.success){
    return res.status(400).json({
message :'Invalid data!',errors:result.error.flatten()


    })
 }
const {name,email,password}=result.data;

const normalizedEmail = email.toLowerCase().trim();

const existinguser = await User.findOne({email:normalizedEmail});
if(existinguser){
    return res.status(409).json({
        message:"Email is already in use!Please try with a different email",
    })
}
const passwordHash = await hashPassword(password);

const newlyCreateduser = await User.create({
 email:normalizedEmail,
 passwordHash,
 role:'user',
 isEmailverified:false,
 twoFactorEnabled : false

})


// Email  verification part

const verifyToken = jwt.sign(
    {
      sub:newlyCreateduser.id
    },process.env.JWT_ACCESS_SECRET!,
    {
        expiresIn:'1d'
    }
)

const verifyUrl = `${getAppUrl()}/auth/verify-email?token=${verifyToken}`






}catch(err){

}

}