import { Router } from "express";
import { loginUser, logoutUser, registerUser,refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";
const router = Router()

router.route("/register").post(
    //inject the middleware before where method is exicuted
    //here we inject the middlewate before the registerUser method
    upload.fields([
        {
           name:"avatar",
           maxCount:1 //how many file u accept
        },
        {
           name:"coverImage",
           maxCount:1
        }
    ]),
    registerUser
    )
// router.route("/login").post(login)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
//verifyJWT check kre ke user logged in chhe ke ny and upload.singel.(avatar) avatar file add kre
router.route("/avatar").patch(verifyJWT,upload.single(avatar),updateUserAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("/coverImage"),updateUserCoverImage)
//username params mathi ave chhe atle e thodik alag rite lakhay chhe
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)

export default router;  // export default router;  // export default router;  // export default router;