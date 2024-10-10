import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videosStats",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "likes",
            },
          },

          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "video",
              as: "comments",
            },
          },

          {
            $group: {
              _id: null,
              totalViews: {
                $sum: "$views",
              },
              totalVideos: {
                $sum: 1,
              },
              totalLikes: {
                $sum: {
                  $size: "$likes",
                },
              },
              totalComments: {
                $sum: {
                  $size: "$comments",
                },
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        stats: {
          $first: "$videosStats",
        },
      },
    },
    {
      $project: {
        username: 1,
        email: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        createdAt: 1,
        subscribersCount: 1,
        stats: 1,
      },
    },
  ]);

  if (stats.length === 0) {
    throw new ApiError(500, "Some error occured.");
  }

  return res.status(200).json(new ApiResponse(200, stats[0]));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        likes: {
          $size: "$likes",
        },
      },
    },
  ]);

  if (!videos) {
    return 404, "No videos uploaded";
  }

  return res.status(200).json(new ApiResponse(200, videos));
});

export { getChannelStats, getChannelVideos };
