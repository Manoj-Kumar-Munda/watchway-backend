import fs from "fs";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      // folder: "videotube"
    });
    
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    //remove the locally saved temp file as the up[load operation got failed
    return null;
  }
};

const deleteAssetOnCloudinary = async (publicId, type='image') => {
  console.log("inside cloudinary", publicId);
  try {
    if (!publicId) {
      return null;
    }

    
    //delete file from cloudinary
    const response = await cloudinary.api.delete_resources([publicId], {
      type: "upload",
      resource_type: type,
    });

    //file has been deleted successfully
    console.log("file is deleted on cloudinary reponse: ", response);
  } catch (error) {
    console.log(error);
    return  null;
  }
};

const getCloudinrayPublicId = (url) => {
  return url.split("/").at(-1).split(".")[0];
};

export { uploadOnCloudinary, deleteAssetOnCloudinary, getCloudinrayPublicId };
