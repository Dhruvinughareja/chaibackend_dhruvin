const asyncHandler = (requestHandler) => {
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

export {asyncHandler}
//higher order function means except as a function and return also as a functino
//try catch wala
// const asyncHandler = (fn) => async(req,res,next) =>{
//     try{
//         await fn(req,res,next)
//     }catch (error){
//         res.status(err.code || 500).json({
//             success:false,
//             message: err.message
//         })
//     }
// }
