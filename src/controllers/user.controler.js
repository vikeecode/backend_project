import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import { log } from 'console';

const generateAcessAndRefereshToken = async(userId) =>{
   try {
      //find a user id
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()
      //now save a refresh token in db
      user.refreshToken= refreshToken
      await user.save({validateBeforeSave: false})

      return{accessToken, refreshToken}
   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating refresh and acess token")
   }
}


const registerUser = asyncHandler(async (req, res) => {
        //  res.status(200).json({
        // message: 'OK'
        // })



        // get user details from frontend
        // validation - not empty, email format, password length, etc
        // check if user already exist - email, username, phone number, etc
        // check for images check for avatar
        //upload image to cloudinary
        // create user object - create entry in db
        //remove password and refresh token field from response
        //check for user creation
        //return res


        const {username, email, fullname, password} = req.body
        console.log("Request Body:", req.body);
        
        // console.log("Username:", username);
        // console.log("Email:", email);

        // if(fullname === "" || fullname === undefined || fullname === null){
        //     throw new ApiError(400, "Fullname is required")
        // }
        //or you can write like this also

        if(
            [fullname, username, email, password ].some( (field) => 
            field?.trim() === "" || field === undefined || field === null) 
         ) {
                throw new ApiError(400, "All fields are required")
            }
            //check user already exist or not
         const existedUser = await User.findOne({
            $or: [{ username }, { email }]
         })   
         if(existedUser){
            throw new ApiError(409, "User already exist")
         }

            //upload image to cloudinary
            const avatarLocalPath = req?.files?.avatar[0]?.path;
            //const coverImageLocalPath = req?.files?.coverImage[0]?.path;
            let coverImageLocalPath;
            if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
                coverImageLocalPath = req.files.coverImage[0].path;
                }
            console.log("req.files:", req.files);
            
             console.log("Avatar Local Path:", avatarLocalPath);
         if(!avatarLocalPath){
            throw new ApiError(400, "Avatar is required")
         }
         //now upload cloudinary
         const avatar = await uploadOnCloudinary(avatarLocalPath);
         const coverImage = await uploadOnCloudinary(coverImageLocalPath);

         if(!avatar){
            throw new ApiError(400, "Avatar upload failed")
         }
         // create user object - create entry in db
        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            username : username.toLowerCase(),
            email,
            password,
         })

         //remove password and refresh token field from response or checking from db
         const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"//this is the syntax to remove the field from response
         )

         if(!createdUser){
            throw new ApiError(500, "Something went wrong while registering the user")
         }

            //return res
        return res.status(201).json(
            new ApiResponse(200, createdUser, "User registered successfully")
        )

} )


const loginUser = asyncHandler(async (req, res) =>{
  //algo means kesa ham apne code likhega kis structure ma login karega a user ko
  //req body -> data get
  //username or email 
  // find the user given username or email
  // password write
  // access token a d refresh token
  //send through cookies
  // and last send a response
  
  //first get a data 
  const {username, email, password} = req.body
  //check for empty fields
  if(!(username || email)){
   throw new ApiError(400, "username or email is required")
  }

  //check for find a username or email in db
  const user = await User.findOne({
     $or: [{ username}, { email}] // this os $or is the db operator
  })
  //if user not found then throw an error
  if(!user){
   throw new ApiError(404, "User does not exist")
  }

  // if user found then go to next step is chec password
 const isPasswordValid = await user.isPasswordCorrect(password)
 //if password is not correct then throw an error
 if(!isPasswordValid){
   throw new ApiError(404, "Invalide user credentails")
  }
  //if password is correct then go to next step is generate a token

 const {accessToken, refreshToken} = await generateAcessAndRefereshToken(user._id)

 //cookies send

 const loggedInUser = await User.findById(user._id).select(
   "-password -refreshToken"//this is the syntax to remove the field from response
 )
 const options = {
   httpOnly: true,
   secure: true //this 2 line tell can not change a cookie in frontend
 }

 return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
   new ApiResponse(200,{
      user: loggedInUser//this is line is use for automatically add a authroization in logout time and not a shoe refresh and generate token
   }, "User logged In Successfully" 
)
  )
})

//logout user
const logoutUser = asyncHandler(async (req, res)=>{
   await User.findByIdAndUpdate(req.user._id, {
      $set: {
         refreshToken: ""
      }
   }, 
{
   new: true,
})
// clearing cookies
   const options = {
      httpOnly : true,
      secure: true,
   }

   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(
      new ApiResponse(200, {}, "User logged out successfully")
   )
})

// here i want if your access token is expired  then you can use a refresh token to get a new access token from db
const refreshAccessToken = asyncHandler(async (req, res)=>{
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken 

  if(!incomingRefreshToken){
   throw new ApiError(401, "Unauthorized request")
  }
//now verify the refresh token
 try {
    const decoded = jwt.verify (
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
    )
    //Find the user by id
    const user = await User.findById(decoded?._id)
  
    if(!user){
     throw new ApiError(401, "Invalid refresh token")
    }
  
     //check if refresh token is same as in db
     if(user?.refreshToken !== incomingRefreshToken){
        throw new ApiError(401, "Refreshtoken is expired or used")
     }
  
     const options = {
        httpOnly: true,
        secure: true,
     }
     //generate new access token and refresh token
  
     const {accessToken, newrefreshToken} = await generateAcessAndRefereshToken(user._id)
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newrefreshToken, options)
     .json(new ApiResponse(200, {
        accessToken,
        refreshToken: newrefreshToken},
        "New access token and refresh token generated successfully"))
 } catch (error) {
      throw new ApiError(401, error?.message || "Invalide refresh token")
 }
})

const changeCurrentPassword = asyncHandler(async (req, res)=>{
   const {oldPassword, newPassword} = req.body

   const user = await User.findById(req.user?._id)

   const isPasswordValid = await user.isPasswordCorrect(oldPassword)

   if(!isPasswordValid){
      throw new ApiError(400, "Old password is incorrect")
   }

   //now set a new password
   user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res.status(200).json(
   new ApiResponse(200,
      {}, "Password changes successfully"
   )
  )
})

//get a current a current user 
const getCurrentUser = asyncHandler(async (req, res)=>{
   return res.status(200).json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req, res)=>{
   const {fullname, email} = req.body;

   //check for empty fields
   if(!fullname || !email){
      throw new ApiError(400, "this field is required");
   }

   //check for user exist or not
   const user = User.findByIdAndUpdate(req.user?._id, {
      $set:{ //this is the syntax to update the field in db
      fullname, 
      email,
      }
   },
{
   new: true, //this is the syntax to get a new user after update
}).select("-password")//this is the syntax to remove the field from response

return res.status(200).json(
   new ApiResponse(200, user, "User updated successfully")
)
})

const updateUserAvatar = asyncHandler(async (req, res)=>{
  const avatarLocalPath = req.file?.path  //this is the syntax to get the file path from req.file
  if(!avatarLocalPath){
   throw new ApiError(400, "Avatar file is missing")
  }
   //upload image to cloudinary
   const avatar = await uploadOnCloudinary(avatarLocalPath)
   if(!avatar.url){
      throw new ApiError(400, "Avatar upload failed")
   }
//now update the user in db
   const user = await User.findByIdAndUpdate(req.user?._id, {
      $set: {
         avatar: avatar.url
      }
   }, 
   {
      new: true,
   }).select("-password")
   //delete the old image from cloudinary
   const oldAvatar = req.user?.avatar
   if(oldAvatar){
      const publicId = oldAvatar.split("/").pop().split(".")[0] //this is the syntax to get the public id from url
      await deleteFromCloudinary(publicId)
   }
   //return the response
   //this is the syntax to remove the field from response
   //this is the syntax to get the new user after update
   return res.status(200).json(
      new ApiResponse(200, user, "User updated successfully")
   )

})

const updateUserCoverImage = asyncHandler (async (req, res)=>{
   const coverImageLocalPath = req.file?.path  //this is the syntax to get the file path from req.file
   if(!coverImageLocalPath){
      throw new ApiError(400, "Cover Image file missing")
   }
   //upload image to cloudinary
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)
   if(!coverImage.url){
      throw new ApiError(400, "Cover Image upload Failed")
   }
   //now update the user in db
   const user = User.findByIdAndUpdate(req.user?._id, {
      $set:{
         coverImage: coverImage.url
      },

   }, 
{
   new: true,
}).select("-password")
   
      return res.status(200).json(
         new ApiResponse(200, user, "cover image updated successfully")
      )
})

const getUserChannelProfile = asyncHandler(async (req, res) =>{
   const {username} = req.params

   if(!username?.trim()){
      throw new ApiError(400, "Username is required")
   }

   const channel = await User.aggregate([
      {
         $match: {
            username: username.toLowerCase()
         }
      },
      //here we are calculating the total number of subscribers using $lookup 
      {
         $lookup:{
            from: "subscriptions",
            localField: "_id",
            froreignField: "channel",
            as: "subscribers",
         }
      },
      //here we are calculating the total number of i am subscribed
      {
         $lookup:{
            from: "Subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo",
         }
      },
      {
         $addFields:{
            //this is the syntax to get the size of array in mongodb
            //and add the new field in the user object
            subscribersCount:{
               $size: "$subscribers",
            },
            subscribedToCount:{
               $size: "$subscribedTo",
            },
            //this is the syntax is check the user is subscribed or not
               isSubscribed:{
                  $cond: {
                     if: { $in: [req.user?._id, "$subscribers.subscriber"]},
                     then: true,
                     else: false,
                  }
               }
            }
      },
      //this is the syntax to remove the field from response
      {
        $project:{
         fullname: 1,
         username:1,
         subscribersCount: 1,
         subscribedToCount: 1,
         isSubscribed: 1,
         avatar: 1,
         coverImage: 1,
         email: 1,
        }
      }
   ])
   console.log(channel);

   if(!channel?.length){
      throw new ApiError(404, "channel does not exists")
   }

   return res.status(200).json(new ApiResponse(200, channel[0], "User channel fetched successfully"))
   
})

export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage} 
