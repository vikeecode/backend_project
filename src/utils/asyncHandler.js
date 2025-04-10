const asyncHandler = (requestHandler) => {
   return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
}
    
}

export {asyncHandler}













// const asyncHandler = () =>{}
// const asyncHandler = (func) => {() => {}} //this like that
// const asyncHandler = (func) => {async() => {}} // write a async function
// const asyncHandler = (fn) => async (requestAnimationFrame, res , next) => {
//     try {
//         await fn(requestAnimationFrame, res, next)        
//     } catch (error) {
//         res.status(error.code || 500).json({
//             sucess: false,
//             message: error.message || 'Internal Server Error',
//         })
//     }
// }