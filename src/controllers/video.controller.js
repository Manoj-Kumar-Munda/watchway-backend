import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteAssetOnCloudinary,
  getCloudinrayPublicId,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

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
  if (!videoId) {
    throw new ApiError(400, "VideoId is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(500, "Internal server error");
  }

  return res.status(200).json(new ApiResponse(200, video));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) {
    throw new ApiError(400, "VideoId not found");
  }

  const video = await Video.findOne(
    { _id: videoId },
    { videoFile: 1, thumbnail: 1 }
  );
  if (!video) {
    throw new ApiError(500, "Video is unavailable");
  }

  const videoPublicId = getCloudinrayPublicId(video.videoFile);
  const thumbnailPublicId = getCloudinrayPublicId(video.thumbnail);

  const result = await Video.deleteOne({
    _id: mongoose.Types.ObjectId.createFromHexString(videoId),
  });

  if (result.deletedCount !== 1) {
    throw new ApiError(500, "Failed to delete video");
  }
  await deleteAssetOnCloudinary(videoPublicId, "video");
  await deleteAssetOnCloudinary(thumbnailPublicId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video successfully deleted"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  video.isPublished = !video.isPublished;

  await video.save({ validateBeforeSave: false });

  const updatedVideo = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(500, "Video not available");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video status updated"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
