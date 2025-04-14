import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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

export {registerUser}
