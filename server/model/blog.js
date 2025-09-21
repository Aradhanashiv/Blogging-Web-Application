const {model , Schema, Types} = require('mongoose');

const postSchema = new Schema({
   title: {
    type : String,
    required: true
   },
   body: {
    type : String,
    required: true,
   },
   coverImageurl: {
      type: String,
      required: true
   },
   createdby: {
    type : Schema.Types.ObjectId,
    ref: 'User'
   },
}, {timestamps:true})


const Post = model('Post' , postSchema);

module.exports =  Post 