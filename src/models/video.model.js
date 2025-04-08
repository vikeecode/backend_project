import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile:{
        type:String,//cloudinary url
        required:true,
    },
    thumbnail:{
        type:String,//cloudinary url
        required:true,
    },
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    duration:{
        type:Number,
        required:true,
    },
    views:{
        type:Number,
        required:true,
        default:0,
    },
    isPublished:{
        type:Boolean,
        default:true,
    }, 
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",//this is the model name of user model
    }

}, {timestamps:true});

videoSchema.plugin(mongooseAggregatePaginate);
// this is the model name of video model



export const video = mongoose.model('video', videoSchema,)