import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
//in below line no need to asyncHandler becaues here we not handle the web request
const generateAccessAndRefreshTokens = async(userId )=>{
  try{
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()


    //refresh token we save in database that's why we don't need to ask the password many times from user
    //user ni andar badhi propertity chhe refresh token pan chhe ema apde add kri devano navo refresh token
    user.refreshToken=refreshToken


    //jyare save kravo tyare mongoose ke method kick in thy jay che for example password vari field pn kick in thy jay chhe means jyare tame save kravo tyare password hovo j joy 
    //that's why we false the validataion before save so that password field will not be validated
    await user.save({ validateBeforeSave: false })


    return {accessToken,refreshToken}
  }catch(error){
    throw new ApiError(500,"Something went wrong while generating refresh and access token")
  }
}
// we write _ insted of res when no need to response/
const registerUser = asyncHandler( async (req, res) => {
    // res.status(500).json({
    // message: "dhruvinpatel"
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullName, email, username, password } = req.body
    console.log("email: ", email);
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files&& Array.isArray(req.files.coverImage)&&req.files.coverImage.lengh>0){
      coverImageLocalPath=req.files.coverImage[0].path
    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
} )

const loginUser = asyncHandler(async(req,res)=>{
    //req body ->data
    // username or email
    //find the user or email in database or server
    //password check
    //access and refresh token
    //send cookies 
    
    //1
    const {email,username,password}=req.body
    if(!username && !email){
      throw new ApiError(400,"username or email is required")  
    }
    
    //2 3
    const user = await User.findOne({
      //find user based on username or based on email
      $or: [{username},{email}]
    })

    if(!user){
      throw new ApiError(400,"User does not exist")
    }

    //4
    //capital user thi nthi krva nu kem ke e mongoose mathi ave chhe 
    //password apde req.body mathi kaydho
    //this.password database ma save chhe e 

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
      throw new ApiError(401,"Invalid password")
    }
    //5
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)

    //6
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    

    //cookies bydefault modifiable by every one at frontend after using httpOnly and secure true then cookie only modifiable by server

    const options = {
      httpOnly :true,
      secure : true
    }
   
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(
        200,
        {
          user:loggedInUser,accessToken,refreshToken
        },
        "User logged In Successfully"
      )
    )
})

const logoutUser = asyncHandler(async(req,res)=>{
// for logout user clear the cookies and reset the refreshToken
//how i find the user by id because here this method not have the user access
//use middleware for logout
//desine own middleware for logout
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset:{
        refreshToken:1,//this removes the field from document
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly :true,
    secure : true,
  } 
  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken ||  req.body.refreshToken
  
  if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError(401,"invalid refresh token")
    }
  
    if(incomingRefreshToken != user?.refreshToken){
      throw new ApiError(401,"Refresh token in expired or used")
    }
  
    const options = {
      httpOnly :true,
      secure : true,
    }
  
    const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {accessToken,refreshToken:newRefreshToken},
        "Access token refreshed"
      )
    )
  
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
  }
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  console.log("Request body:", req.body);

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
})
const getCurrentUser = asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(new ApiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullName,email} = req.body

  if(!fullName || !email){
    throw new ApiError("All fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email:email
      }
    },
    //new:true give u the updated info as return
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,ApiResponse(200,user,"Account details updated successfully")))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400,"Error while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {new:true}
  ).select("-password")
  
  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"avatar updated successfully")
  )
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400,"Cover Image file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400,"Error while uploading on coverImage")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage:coverImage.url
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"Cover image updated successfully")
  )

})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
   const {username} = req.params

   if(!username?.trim()){
      throw new ApiError(400,"username is missing")
   }
   //aggregation pipeline
   //aggregate takes the array
   //aggregate return type is array of values
   const channel = await User.aggregate([
    {
      $match:{
        username:username?.toLowerCase()
      }
    },
    //find the user's subscriber
    {
      $lookup:{
        //Subscription is covert into subscriptions
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as: "subscribers"
      }
    },
    //find how many channels the user is subscribed to
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as: "subscribedTo"
      }
    },
    //write pipeline to add above two fields
    {
      $addFields:{
        subscribersCount:{$size:"$subscribers"},
        channelsSubscribedToCount:{$size:"$subscribedTo"},
        //we add one field for frontend for check that user is subscribe this channel or not
        isSubscribed:{
          $cond:{
            //$in check that this is present or not .$in check in array and object both
            if:{$in:[req.user?._id,"$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      //$project pass only selected values
      $project:{
        fullName:1,
        username:1,
        subscribersCount:1,
        channelsSubscribedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1
      }
    }
   ])

   if(!channel?.length){
    throw new ApiError(404,"channel does not exists")
   }

   return res
   .status(200)
   .json(
      new ApiResponse(200,channel[0],"User channel fetched successfully")
  )
})

const getWatchHistory = asyncHandler(async(req, res) => {
  const user = await User.aggregate([
      {
          $match: {
            // if req.user._id in numeric then use belove sintext
            // _id: mongoose.Types.ObjectId.createFromTime(req.user._id)
            //if string
            _id: new mongoose.Types.ObjectId(req.user._id)
          }
      },
      {
          $lookup: {
              from: "videos",
              localField: "watchHistory",
              foreignField: "_id",
              as: "watchHistory",
              pipeline: [
                  {
                      $lookup: {
                          from: "users",
                          localField: "owner",
                          foreignField: "_id",
                          as: "owner",
                          pipeline: [
                              {
                                  $project: {
                                      fullName: 1,
                                      username: 1,
                                      avatar: 1
                                  }
                              }
                          ]
                      }
                  },
                  {
                      $addFields:{
                          owner:{
                              $first: "$owner"
                          }
                      }
                  }
              ]
          }
      }
  ])

  return res
  .status(200)
  .json(
      new ApiResponse(
          200,
          user[0].watchHistory,
          "Watch history fetched successfully"
      )
  )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
} 







// import { ApiError } from "../utils/ApiError.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import {User} from "../models/user.model.js";
// import { uploadOnCloudinary } from "../utils/cloudinary.js";
// import { ApiResponse } from "../utils/ApiResponse.js";


// const registerUser = asyncHandler(async(req,res)=>{
//     // return res.status(200).json({
//     //     message:"ok"
//     // })

//     //steps
//     //1. get user detail from frontend.frontend means user postman like get request post request
//     //2. validate user detail - not empty
//     //3. check if user already exist - check with username and email
//     //4. check for images, check for avatar
//     //5. upload them to cloudinary ,avatar
//     //6. create uesr object - create entry in db
//     //7. remove password and refreash token field from response
//     //8. check for user creation successfull or not
//     //9. return response to frontend


//     //1
//     //res.body get data which comes from json and form.from url is sapatate
//     const {fullName,email,username,password}=req.body
//     console.log("email:",email);

//     //2
//     // if(fullName === ""){
//     //     throw new ApiError(400,"fullname is required")
//     // }
//     if(
//         [fullName,email,username,password].some((field)=>field?.trim()==="")
//     ){
//         throw new ApiError(400,"all fields are required")
//     }

//     //3
//     const existedUser = await User.findOne({
//         $or:[{username},{email}]
//     })

//     if (existedUser){
//         throw new ApiError(409,"User with email or username already exists")
//     }
//     //console.log(req.files);

//     //4 middleware add the other fields in request
//     //multer give the access of req.file
//    const avatarLocalPath = req.files?.avatar[0]?.path;
//    const coverImageLocalPath = req.file?.coverImage[0]?.path;
   
// //    console.log("avatarLocalPath: ",avatarLocalPath);
//    if(!avatarLocalPath){
//      throw new ApiError(400,"Avatar file is required")
//    }
//    //5 
//    //upload them to cloudinary
   
//    const avatar = await uploadOnCloudinary(avatarLocalPath)
//    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
   
//    if(!coverImage){
//     throw new ApiError(401,"Cover Image file is required");
//    }
//    console.log("Uploaded Avatar:" ,coverImage);
//    if(!avatar){
//     throw new ApiError(400,"Avatar file is required");
//    }
   
//    //6
//    const user = await User.create({
//     fullName,
//     avatar:avatar.url,
//     coverImage:coverImage?.url || "",
//     email,
//     password,
//     username:username.toLowerCase()
//    })

//    //7.check that user in empty or not. or find id
//   const createdUser = await User.findById(user._id).select(
//     //here we write that which things we don't want because by default all things is selected
//     "-password -refreshToken" //we don't want password and refreshToken
//   )
// //8.
//   if(!createdUser){
//     throw new ApiError(500,"something went wrong while registering the user") 
//   }

//   //9.
//   return res.status(201).json(
//     //create new object of apiresponse that how we return the response
//     new ApiResponse(200,createdUser,"User registered Successfully")
//   )

// })

// export {registerUser,} 