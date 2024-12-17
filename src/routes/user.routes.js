import { Router } from "express";
import { loginUser, logoutUser, registerUser,refreshAccessToken } from "../controllers/user.controller.js";
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



export default router;  // export default router;  // export default router;  // export default router;