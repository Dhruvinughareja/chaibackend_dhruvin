import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async(req,res)=>{
    // return res.status(200).json({
    //     message:"ok"
    // })

    //steps
    //1. get user detail from frontend.frontend means user postman like get request post request
    //2. validate user detail - not empty
    //3. check if user already exist - check with username and email
    //4. check for images, check for avatar
    //5. upload them to cloudinary ,avatar
    //6. create uesr object - create entry in db
    //7. remove password and refreash token field from response
    //8. check for user creation successfull or not
    //9. return response to frontend


    //1
    //res.body get data which comes from json and form.from url is sapatate
    const {fullName,email,username,password}=req.body
    console.log("email:",email);

    //2
    // if(fullName === ""){
    //     throw new ApiError(400,"fullname is required")
    // }
    if(
        [fullName,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"all fields are required")
    }

    //3
    const existedUser = User.findOne({
        $or:[{uesrname},{email}]
    })

    if (existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

    //4 middleware add the other fields in request
    //multer give the access of req.file
   const avatarLocalPath =  req.files?.avatar[0]?.path;
   const coverImageLocalPath = req.file?.coverImage[0]?.path;

   if(!avatarLocalPath){
     throw new ApiError(400,"Avatar file is required")
   }
   //5 
   //upload them to cloudinary
   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar){
    throw new ApiError(400,"Avatar file is required")
   }

   //6
   const user = await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
   })

   //7.check that user in empty or not. or find id
  const createdUser = await User.findById(user._id).select(
    //here we write that which things we don't want because by default all things is selected
    "-password -refreshToken" //we don't want password and refreshToken
  )
//8.
  if(!createdUser){
    throw new ApiError(500,"something went wrong while registering the user") 
  }

  //9.
  return res.status(201).json(
    //create new object of apiresponse that how we return the response
    new ApiResponse(200,createdUser,"User registered Successfully")
  )
  
})

export {registerUser,} 