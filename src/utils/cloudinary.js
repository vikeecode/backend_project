import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
}); 

const uploadOnCloudinary = async (localFilePath)=>{
    try {
       if(!localFilePath) return null;
       //check if the file exists
       //upload the file to cloudinary
       const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type: "auto",
       }) 
       //file has been uploaded to sucessfully
       console.log("Cloudinary response:", response.url);
       return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)//delete the file from local storage
        //remove the locally saved temporary file as the upload failed
        return null;
    }
}

export {uploadOnCloudinary};