import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
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

export default router;  // export default router;  // export default router;  // export default router;