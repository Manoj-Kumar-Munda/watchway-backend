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
    });
    //file has been uploaded successfully
    console.log("file is uploaded on cloudinary reponse: ");
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    //remove the locally saved temp file as the up[load operation got failed
    return null;
  }
};

const deleteAssetOnCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      return null;
    }

    //delete file from cloudinary
    const response = await cloudinary.v2.uploader.destroy(publicId);

    //file has been deleted successfully
    console.log("file is deleted on cloudinary reponse: ", response);
  } catch (error) {
    return null;
  }
};

export { uploadOnCloudinary, deleteAssetOnCloudinary };
