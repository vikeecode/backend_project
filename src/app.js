import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({limit:'16kb'}));
app.use(express.urlencoded({extended:true, limit:'16kb'}));
app.use(express.static('public'));
app.use(cookieParser());


//routes imports

import userRoutes from './routes/user.route.js';

//routes declaration
app.use('/api/v1/users', userRoutes);

//your url look like that

//http://localhost:8000/api/v1/users/register  somwthing like that
// and now not change your app.js part every time this is good practice


export {app};