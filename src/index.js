// require('dotenv').config({  path: './.env' });
import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';

dotenv.config({ path: './.env' });

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8002, () => {
        console.log(`Server is running on port ${process.env.PORT || 8002}`);
        app.on('error', (err) => {
            console.log("Server error:", err);
            throw err;
        })
        
    })
})
.catch((err) =>{
    console.log("MONGO db connection !!!!", err);
    
})