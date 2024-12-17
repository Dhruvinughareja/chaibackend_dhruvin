import {v2 as cloudinary} from "cloudinary"

import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});
// console.log("Cloudinary Config:", cloudinary.config());


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        // console.log("Uploading file to Cloudinary:", localFilePath);

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
          })
        // file has been uploaded successfull
        //pela niche ni line comment mari ti atle public/temp ma show thatu tu avatar file and coverImage file hve ola ye on kri atle me pn kri nakhi
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath); // Remove the locally saved temporary file
        }
        return response;

    } catch (error) {

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }        
        return null;
    }
}


export {uploadOnCloudinary}