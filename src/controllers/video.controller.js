import mongoose, { isValidObjectId } from "mongoose";
import { sortingOptons, Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteAssetOnCloudinary,
  getCloudinrayPublicId,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getSortingOptions = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, sortingOptons, ""));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { query, sortBy = "createdAt", sortType = 1 } = req.query;

  const page = +req.query.page;
  const limit = +req.query.limit;

  if (page < 1) {
    throw new ApiError(400, "Invalid page number");
  }
});

const getSearchResults = asyncHandler(async (req, res) => {
  // const {
  //   page = 1,
  //   limit = 10,
  //   query='',
  //   sortBy = "createdAt",
  //   sortType = 1,
  // } = req.query;
  const { query = "" } = req.query;
  console.log(query);

  const searchResults = await Video.aggregate([
    {
      $match: {
        $text: {
          $search: query,
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              avatar: 1,
            },
          },
        ],
        as: "owner",
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  if (searchResults.length === 0) {
    throw new ApiError(404, "No video found");
  }

  return res.status(200).json(new ApiResponse(200, searchResults));
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

  const { title, description } = req.body;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  if (!req.user._id.equals(video.owner)) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      title,
      description,
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Title and description updated"));
});

const changeThumbnail = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "VideoId is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  if (!req.user._id.equals(video.owner)) {
    throw new ApiError(403, "Not authorized");
  }

  const newThumbnailLocalPath = req.file?.path;
  if (!newThumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const thumbnail = await uploadOnCloudinary(newThumbnailLocalPath);

  if (!thumbnail.url) {
    throw new ApiError(400, "error while uploading on avatar");
  }

  const oldThumbnailPublicId = getCloudinrayPublicId(video.thumbnail);
  await deleteAssetOnCloudinary(oldThumbnailPublicId);

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        thumbnail: thumbnail.url,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "thumbnail updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "VideoId is required");
  }

  const video = await Video.findOne(
    { _id: videoId },
    { videoFile: 1, thumbnail: 1, owner: 1 }
  );

  if (!req.user._id.equals(video.owner)) {
    throw new ApiError(403, "You are not authorized to delete this video");
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

  if (!req.user._id.equals(video.owner)) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  video.isPublished = !video.isPublished;

  await video.save({ validateBeforeSave: false });

  const updatedVideo = await Video.findById(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video status updated"));
});

export {
  getSortingOptions,
  getSearchResults,
  publishAVideo,
  getVideoById,
  updateVideo,
  changeThumbnail,
  deleteVideo,
  togglePublishStatus,
};
