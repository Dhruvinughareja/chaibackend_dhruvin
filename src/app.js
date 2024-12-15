import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
//use is a middleware

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import

import userRouter from "./routes/user.routes.js"


//routes declateation  using app.use() You simply get routes. use is like a middle ware nd it is complasory bcz our routes are in saparate file

app.use("/users",userRouter)  // whan user type /user  you give the control of the userRouter

//user url like this http://localhost:8000/users/register
//after u right new control in user.routes.js like /login like will be change like http://localhost:8000/users/login
//if u define api then tell that u define the api and what is the version of api.this is the best practice user api like this
app.use("/api/v1/users",userRouter) // this is standard practice and url is like
//http://localhost:8000/api/v1/users/register



export {app};