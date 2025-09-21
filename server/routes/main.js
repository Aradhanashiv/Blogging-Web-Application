const express = require('express');
const Post = require('../model/blog')
const router = express.Router();
const userModal = require('../model/user')
const bcrypt = require('bcrypt')
const JWT = require('jsonwebtoken')
const multer = require('multer');
const path = require('path')
const Comment = require('../model/comment')
const checkforAuthenticate = require('../../middlewares/authenticate')

const authLayout = "../views/layouts/auth"

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/blogImage'))
  },
  filename: function (req, file, cb) {
    const filename = `${Date.now()}-${file.originalname}`
    cb(null, filename);
  }
})

const upload = multer({ storage: storage })

router.get('/' , async (req,res)=>{
try {
const data = await Post.find()
    res.render('index' ,{ 
     user : req.user,
     data : data,
 });     
} 
catch (error) {
  console.log(error);  
  res.status(500).send('Internal Server Error');
 } 
})

// POST -> SIGNUP/ SIGNIN
router.get('/signup' , (req,res)=>{
    res.render('signup', { layout : authLayout});
})

router.post('/signup' , async(req,res)=>{
    try {
     const {name, email, password} = req.body;
    if(!name || !email || !password) {
        return res.send({message: "All fields are Required"})
    }
    const isExistingUser = await userModal.findOne({email});
    if(isExistingUser) {
        return res.send({message: "User Already Registered"})
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = await userModal.create({
        name,
        email,
        password : hashedPassword
    })

    const payload = {
        _id : newUser._id,
        name : newUser.name,
        email : newUser.email
    } 
    const token = JWT.sign(payload , process.env.JWT_SECRET);
    if(!token){
          return res.send({message: "Token is not create"})
    }
    res.cookie('Token' , token, {httpOnly : true}).redirect('/signin');
    
    } catch (error) {
        console.log(error); 
        res.status(500).send({message: 'Internal Server Error'})
    }    
})

// SIGNIN - POST/GET
router.get('/signin' , (req,res)=>{
    res.render('signin' , {
        user : req.user,
        layout : authLayout
    });
})

router.post('/signin' , async(req,res)=>{
   try {
     const {email, password} = req.body;
    if(!email || !password) {
        return res.send({message: "All fields are Required"})
    }
    const user = await userModal.findOne({email});
    if(!user) {
        return res.send({message: "User not Found"})
    }

    const isPasswordCorrect  = await bcrypt.compare(password , user.password);
    if(!isPasswordCorrect){
         return res.send({message: "Password is incorrect"})
    }

    const payload = {
        _id : user._id,
        name : user.name,
        email : user.email
    } 
    const token =JWT.sign(payload , process.env.JWT_SECRET);
     if(!token){
          return res.send({message: "Token is not created"})
     }
    res.cookie('Token' , token, {httpOnly : true}).redirect('/')}
    catch (error) {
     console.log(error); 
     res.status(500).redirect('/signin')
   }
})


// ADDBLOG - POST/GET
router.get('/add-blog' , (req,res)=>{
    res.render('add-blog' , {user : req.user})
})

router.post('/add-blog' , upload.single("coverImage"), async(req,res)=>{
   const { title, body } = req.body;
   const newBlog = await Post.create({
    title,
    body,
    coverImageurl: `uploads/blogImage/${req.file.filename}`,
    createdby : req.user._id
   })
   console.log(newBlog);
   return res.redirect(`/post/${newBlog._id}`)
})

// GET->POST and COMMENT ON POST
router.get('/post/:id' ,async(req,res)=>{
     try {
      const post = await Post.findById(req.params.id).populate("createdby")
      const comments = await Comment.find({BlogId : req.params.id}).populate("commentBy")
      console.log("Post found:", post);
      res.render('post' , {post, user: req.user, comments })
    } catch (error) {
         console.log(error);
    }
})

router.post('/post/:id/comment' , async(req,res)=>{
       const{ body } = req.body;
       await Comment.create({
       body,
       commentBy : req.user._id,
       BlogId: req.params.id
        })
     res.redirect(`/post/${req.params.id}`);

})

// SEARCH ON POST
router.post('/search' , async(req,res)=>{
    try {
        let searchTerm = req.body.searchTerm;
        const searchNoSpecialCharacter = searchTerm.replace(/[^a-zA-Z0-9]/g , "")
        
        const data = await Post.find({
            $or: [
                {title: { $regex: new RegExp(searchNoSpecialCharacter , 'i')}},
                {body: { $regex: new RegExp(searchNoSpecialCharacter , 'i')}}
            ]
        })
         res.render('search' , {
            data, user : req.user
         });
    } catch (error) {
         console.log(error);
    }
})


//User Profile
router.get('/user-profile/:id' , async(req,res)=>{
    const blog =await Post.find({createdby : req.params.id})
    res.render('user-profile' , {
        user : req.user,
        blog
    })
})

//Edit Blog
router.get('/edit-blog/:id' , async(req,res)=>{
    const blog = await Post.findById(req.params.id)
    res.render('edit-blog' , {
        user: req.user,
        blog
    })
})

router.put('/edit-blog/:id' , upload.single("coverImage"), async(req,res)=>{
    try {
        const blog = await Post.findById(req.params.id)
        if(!blog){
           res.status(404).send({success : false, message : 'Blog Not found'})
        }
        if(blog.createdby.toString() !== req.user._id){
         res.status(403).send({success : false, message : 'Unauthorized '})           
        }
        const updatedBlog = await Post.findByIdAndUpdate(req.params.id, {
          title : req.body.title,
          body : req.body.body,
          coverImageurl : `uploads/blogImage/${req.file.filename}`
       }) 
        updatedBlog.save();
        res.status(200).redirect(`/post/${blog._id}`)
    } catch (error) {
        console.log(error);
        res.status(500).send({success : false, message : 'Internal server error'})
    }
})

//Delete Blog
router.delete('/delete-blog/:id' ,checkforAuthenticate, async(req,res)=>{
try {
   const result = await Post.deleteOne({_id : req.params.id});
   if(result.deletedCount === 0){
      return res.status(404).redirect('/').json({message: "Blog Not Found"})
   }
    return res.status(200).redirect('/').json({message: "Blog Deleted Successfully"})
} catch (error) {
    console.log(error);
     return res.status(500).json({ message: "Internal Server Error" });
}
})

//LOGOUT
router.get('/logout' ,(req,res)=>{
    res.clearCookie('Token').redirect('/')
})

module.exports =  router