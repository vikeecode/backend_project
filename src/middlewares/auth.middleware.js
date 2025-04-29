import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";


export const verifyJWT = asyncHandler(async (req, _, next)=>{//here underscore is only use beacuse the res is not use at this time that's why we can write a  underscore
   try {
     const token = req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1];
 
     if(!token){
         throw new ApiError(401, "Unauthorized request")
     }
 
     const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
      console.log("Decoded JWT:", decoded);
     const user = await User.findById(decoded?._id).select("-password -refreshToken")
 
     if(!user){
         throw new ApiError(401, "Invalid Access Token")
     }
     req.user = user
     next()
   } catch (error) {
        throw new ApiError(401, error?.message || " invalide access token")
    
   }
})