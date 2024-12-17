//verify that user exist or not
//JWT  JSON web token

import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
//next is for indicate that my work is done ab jaha pe bhi isko leke jana hai leke jao

export const verifyJWT = asyncHandler(async(req,res,next)=>{
   try {
    //req have cookie access because we give access to req in app.js
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
 
    if(!token){
     throw new ApiError(401,"Unauthorized request")
    }
    //verify token
 
    const decodedToken =  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
     
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
 
    if(!user){
     throw new ApiError(401,"Invalid Access Token")
    }
    req.user = user; 
    next()
   } catch (error) {
     throw new ApiError(401,error?.message||"Invalid access token")
   }
})