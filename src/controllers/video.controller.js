import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  // const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
  //TODO: get all videos based on query, sort, pagination
  const page = parseInt(req.query.page) - 1 || 0;
  const limit = parseInt(req.query.limit) || 10;
  const query = req.query.limit || null;
  const sortBy = req.query.sortBy || "createdAt";
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!title) {
    throw new ApiError(400, "Video title is required");
  }

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const videoURL = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnailURL = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoURL) {
    throw new ApiError(500, "Failed to upload video");
  }
  if (!thumbnailURL) {
    throw new ApiError(500, "Failed to upload thumbnail");
  }

  console.log(videoURL);
  console.log(thumbnailURL);

  const video = await Video.create({
    title,
    description,
    duration: videoURL.duration,
    videoFile: videoURL.url,
    thumbnail: thumbnailURL.url,
    views: 0,
    isPublished: true,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(500, "Failed to upload the video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video is uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
