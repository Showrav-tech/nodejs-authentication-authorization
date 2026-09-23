import {Request,Response} from "express";
import { loginSchema, registerSchema } from "./auth.schema";
import { User } from "../../models/user.model";
import { checkPassword, hashPassword } from "../../lib/hash";
import jwt from 'jsonwebtoken';
import { sendEmail } from "../../lib/email";
import { createAccessToken, createRefreshToken } from "../../lib/token";
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
 twoFactorEnabled : false,
 name

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

export async function verifyEmailHandler(req:Request,res:Response){
const token =req.query.token as string | undefined;
if(!token){
  return res.status(400).json({message : 'Verification token is missing'});

}
try {
  const payload = jwt.verify(token,process.env.JWT_ACCESS_SECRET!) as{
    sub:string;
  }
  const user=await User.findById(payload.sub);

if(!user){
  return res.status(400).json({message : 'User not found'});

}
if(user.isEmailverified){
  return res.json({message : 'Email is already verified'});
}

user.isEmailverified=true;
await user.save();
  return res.json({message : 'Email is now verified! You can login'});
} catch (err) {
  console.log(err);
    return res.status(500).json({message : 'Internal server error'});
}



}

export async function loginHandler(req:Request,res:Response){

try {
  const result = loginSchema.safeParse(req.body);
 if(!result.success){
    return res.status(400).json({
message :'Invalid data!',errors:result.error.flatten()


    })
 }
const {email,password}=result.data;

const normalizedEmail = email.toLowerCase().trim();
const user = await User.findOne({email:normalizedEmail});
if(!user){
  return res.status(400).json({message : 'Invalid email or password'});
}

const ok=await checkPassword(password,user.passwordHash);
  
if(!ok){
  return res.status(400).json({message : 'Invalid password'});
}
if(!user.isEmailverified){
  return res.status(403).json({message : 'please verify your email before logged In'});

}
const accessToken =createAccessToken(
  user.id,
  user.role,
  user.tokenVersion
)

const refreshToken = createRefreshToken(user.id,user.tokenVersion);
const isProd=process.env.NODE_ENV==='production';
res.cookie("refreshToken",refreshToken,{
  httpOnly:true,
  secure:isProd,
  sameSite:'lax',
  maxAge : 7*24*60*60*1000
})

return res.status(200).json({
message:'Login successfully done',
accessToken,
user:{
id:user.id,
email:user.email,
role:user.role,
isEmailVerified:user.isEmailverified,
twoFactorEnable:user.twoFactorEnabled,

},
});

} catch (err)
 {
   console.log(err);
    return res.status(500).json({
      message : 'Internal server error'});
}

}







