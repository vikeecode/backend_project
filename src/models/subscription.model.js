import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber:{
        type: Schema.Types.ObjectId,//one who is Subscribing
        ref:"User",
    },
    channel:{
        type: Schema.Types.ObjectId,//one who is being Subscribed to
        ref:"User",
    }
},{timestamps:true});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);