const JWT = require('jsonwebtoken')
function checkforAuthenticate(cookieName){
  return (req,res,next)=> {
    const cookieValue = req.cookies[cookieName];
    if(!cookieValue){
      return next();
    }
    try {
     const userPayload = JWT.verify(cookieValue, process.env.JWT_SECRET);
     req.user =  userPayload;
    //  res.locals.user = userPayload
    } catch (error) {}
    next();
  }
}

module.exports = checkforAuthenticate