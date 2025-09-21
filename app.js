require('dotenv').config(); //dotenve is a packeage that loads environmentals variable from.envfile to process.env in Node.js
const express = require('express')
const cookieParser = require('cookie-parser')
const expressLayout = require('express-ejs-layouts')
const mainRouter = require('./server/routes/main')
const connectMongoDB = require('./server/config/db')
const checkforAuthenticate = require('./middlewares/authenticate')
const methodOverride = require('method-override')

const PORT = 3000 || process.port.PORT;
const app = express();

connectMongoDB()

app.use(methodOverride('_method'))
app.use((req,res,next)=>{
    res.locals.currentPath = req.path;
    next()
})
app.use(cookieParser());
app.use(express.static('public'))
app.use(express.urlencoded({extended : true}));
app.use('/uploads', express.static('uploads'));
app.use(checkforAuthenticate('Token'))
app.use(express.json());
app.use(expressLayout);
app.use(cookieParser())
app.set('layout' , './layouts/main')
app.set('view engine' , 'ejs');



app.use('/' , mainRouter)

app.listen(PORT , ()=>console.log(`Server started at port: ${PORT}`));