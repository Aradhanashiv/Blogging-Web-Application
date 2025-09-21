const mongoose = require('mongoose');
const connectMongoDB = async () => {
        try {
        mongoose.set('strictQuery' , false);
       const conn = await mongoose.connect(process.env.mongoDB_url);
       console.log(`DatabaseConnected: ${conn.connection.host}`);
       
    } catch (error) {
        console.log(error);
        
    }
}


module.exports = connectMongoDB;

    