import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const isLiked = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

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

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const isLiked = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (isLiked) {
    await Like.findByIdAndDelete(isLiked._id);

    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  const likedComment = await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (!likedComment) {
    throw new ApiError(500, "Failed to like the comment");
  }

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "tweet not found");
  }

  const isLiked = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (isLiked) {
    await Like.findByIdAndDelete(isLiked._id);

    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  const likedTweet = await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (!likedTweet) {
    throw new ApiError(500, "Failed to like the tweet");
  }

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: { $ne: null },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoInfo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },

          {
            $unwind: {
              path: "$owner",
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$videoInfo",
      },
    },
    {
      $project: {
        _id: 1,
        videoInfo: 1,
      },
    },
  ]);

  if (!likedVideos) {
    throw new ApiError("Error while getting liked videos");
  }

  return res.status(200).json(new ApiResponse(200, likedVideos));
});

const getLikeStatus = asyncHandler(async (req, res) => {
  const { resource, id } = req.query;

  if (!resource || !id) {
    throw new ApiError(400, "Resource type and ID are required");
  }

  if (!["video", "comment", "tweet"].includes(resource)) {
    throw new ApiError(400, "Invalid resource type");
  }

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid resource ID");
  }

  const isLiked = await Like.findOne({
    [resource]: id,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: !!isLiked }));
});

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
  getLikeStatus,
};
