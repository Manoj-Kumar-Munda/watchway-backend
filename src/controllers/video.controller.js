import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteAssetOnCloudinary,
  getCloudinrayPublicId,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  let { userId, page, limit, sortBy, sortOrder } = req.query;

  page = (parseInt(page) && (page < 1 ? 1 : page)) || 1;
  limit = (parseInt(limit) && (limit < 1 ? 10 : limit)) || 10;

  sortBy = req.query.sortBy || "createdAt";
  sortOrder = (parseInt(sortOrder) && (sortOrder >= 1 ? 1 : -1)) || 1;

  //return all videos to be displayed on homepage
  const aggregate = Video.aggregate([
    {
      $match: {
        isPublished: true,
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
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
        as: "owner",
      },
    },
    {
      $unwind: {
        path: "$owner",
      },
    },
    {
      $sort: {
        [sortBy]: sortOrder,
      },
    },
  ]);

  const videos = await Video.aggregatePaginate(aggregate, {
    page: page,
    limit: limit,
  });

  return res.status(200).json(new ApiResponse(200, videos, ""));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  let { id, page, limit, sortBy, sortOrder } = req.query;

  page = (parseInt(page) && (page < 1 ? 1 : page)) || 1;
  limit = (parseInt(limit) && (limit < 1 ? 10 : limit)) || 10;

  sortBy = req.query.sortBy || "createdAt";
  sortOrder = (parseInt(sortOrder) && (sortOrder >= 1 ? 1 : -1)) || 1;

  const aggregate = Video.aggregate([
    {
      $match: {
        $and: [
          { owner: new mongoose.Types.ObjectId(id) },
          { isPublished: true },
        ],
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
              avatar: 1,
            },
          },
        ],
        as: "owner",
      },
    },
    {
      $unwind: {
        path: "$owner",
      },
    },
    {
      $sort: {
        [sortBy]: sortOrder,
      },
    },
  ]);

  const videos = await Video.aggregatePaginate(aggregate, {
    page: page,
    limit: limit,
  });

  return res.status(200).json(new ApiResponse(200, videos, ""));
});

const getSearchResults = asyncHandler(async (req, res) => {
  const page =
    (parseInt(req.query.page) && (req.query.page < 1 ? 1 : req.query.page)) ||
    1;
  const limit =
    (parseInt(req.query.limit) &&
      (req.query.limit < 1 ? 10 : req.query.limit)) ||
    10;
  const query = req.query.query || "";
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = (parseInt(req.query.sortOrder) && (req.query.sortOrder >= 1 ? 1 : -1)) || 1;

  const aggregate = Video.aggregate([
    {
      $match: {
        $text: {
          $search: query,
        },
      },
    },
    {
      $match: {
        isPublished: true,
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
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
        as: "owner",
      },
    },
    {
      $unwind: {
        path: "$owner",
      },
    },
    {
      $sort: {
        [sortBy]: sortOrder,
      },
    },
  ]);

  const searchResults = await Video.aggregatePaginate(aggregate, {
    page,
    limit,
  });

  return res.status(200).json(new ApiResponse(200, searchResults));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    throw new ApiError(400, "Video title is required");
  }

  const videoFileLocalPath = req.files?.video[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }
  console.log(videoFileLocalPath);
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
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "videoLikes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$videoLikes",
        },
        isLiked: {
          $cond: {
            if: {
              $in: [
                new mongoose.Types.ObjectId(req?.user?.id),
                "$videoLikes.likedBy",
              ],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        videoLikes: 0,
      },
    },
  ]);

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
    throw new ApiError(403, "You are not authorized to make changes");
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
    throw new ApiError(403, "You are not authorized to make changes");
  }

  video.isPublished = !video.isPublished;

  await video.save({ validateBeforeSave: false });

  const updatedVideo = await Video.findById(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video status updated"));
});

export {
  getAllVideos,
  getSearchResults,
  publishAVideo,
  getVideoById,
  updateVideo,
  changeThumbnail,
  deleteVideo,
  togglePublishStatus,
  getChannelVideos,
};
