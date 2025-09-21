const {Schema , modal, model}= require('mongoose');

const commentSchema = new Schema({
    body: {
        type: String,
        required: true
    },
    commentBy : {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    BlogId: {
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }  
})

module.exports = model('Comment' , commentSchema);