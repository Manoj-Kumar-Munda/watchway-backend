import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const isLiked = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  console.log(isLiked);

  if (isLiked) {
    await Like.findByIdAndDelete(isLiked._id);

    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  const likedVideo = await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (!likedVideo) {
    throw new ApiError(500, "Failed to like the video");
  }

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  const isLiked = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (isLiked) {
    await Like.findByIdAndDelete(isLiked._id);

    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  const likedVideo = await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (!likedVideo) {
    throw new ApiError(500, "Failed to like the video");
  }

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const isLiked = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  console.log(isLiked);

  if (isLiked) {
    await Like.findByIdAndDelete(isLiked._id);

    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  const likedVideo = await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (!likedVideo) {
    throw new ApiError(500, "Failed to like the video");
  }

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const getLikedVideos = asyncHandler(async (req, res) => {

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
            },
          },
          {
            $unwind: "$ownerDetails",
          },
        ],
      },
    },
    {
      $unwind: "$likedVideos",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        likedVideos: {
          _id: 1,
          "videoFile.url": 1,
          "thumbnail.url": 1,
          owner: 1,
          title: 1,
          description: 1,
          views: 1,
          duration: 1,
          createdAt: 1,
          isPublished: 1,
          ownerDetails: {
            username: 1,
            fullName: 1,
            avatar: 1,
          },
        },
      },
    },
  ]);

  if(!likedVideos){
    throw new ApiError("Error while getting liked videos");
  }

  return res.status(200).json(new ApiResponse(200, likedVideos));

});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
