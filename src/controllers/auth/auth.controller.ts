import {Request,Response} from "express";
import { registerSchema } from "./auth.schema";
import { User } from "../../models/user.model";
import { hashPassword } from "../../lib/hash";
import jwt from 'jsonwebtoken';
import { sendEmail } from "../../lib/email";

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


await sendEmail(
  newlyCreateduser.email,
  "Verify your email",
  `
    <p>Please verify your email by clicking the link below.</p>
    <a href="${verifyUrl}">Verify Email</a>
  `
);

return res.status(201).json({

  message:'User registered',
  user :{

  id:newlyCreateduser.id,
    email:newlyCreateduser.email,
  role:newlyCreateduser.role,
  isEmailVerified:newlyCreateduser.isEmailverified
  }
 

})

}catch(err){
    console.log(err);
    return res.status(500).json({
        message:"Internal server error"
    })
}

}